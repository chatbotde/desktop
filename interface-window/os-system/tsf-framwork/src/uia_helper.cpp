#include "uia_helper.h"
#include <oleauto.h>
#include <algorithm>
#include <sstream>
#include <cstdint>

namespace {

std::wstring HwndToWString(HWND hwnd) {
    if (!hwnd) return L"";
    std::wostringstream oss;
    oss << reinterpret_cast<uintptr_t>(hwnd);
    return oss.str();
}

HWND ReadNativeHwnd(IUIAutomationElement* element) {
    if (!element) return nullptr;
    UIA_HWND uiaHwnd = 0;
    if (FAILED(element->get_CurrentNativeWindowHandle(&uiaHwnd))) {
        return nullptr;
    }
    return reinterpret_cast<HWND>(uiaHwnd);
}

bool PatternAvailable(IUIAutomationElement* element, PATTERNID patternId) {
    if (!element) return false;
    IUnknown* pattern = nullptr;
    HRESULT hr = element->GetCurrentPattern(patternId, &pattern);
    if (SUCCEEDED(hr) && pattern) {
        pattern->Release();
        return true;
    }
    return false;
}

}  // namespace

UiaHelper::UiaHelper() = default;

UiaHelper::~UiaHelper() {
    ReleaseAutomation();
}

bool UiaHelper::EnsureAutomation() {
    if (m_automation) return true;

    HRESULT hrCom = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    if (SUCCEEDED(hrCom) || hrCom == RPC_E_CHANGED_MODE) {
        m_comInitialized = SUCCEEDED(hrCom);
    }

    HRESULT hr = CoCreateInstance(
        CLSID_CUIAutomation,
        nullptr,
        CLSCTX_INPROC_SERVER,
        IID_PPV_ARGS(&m_automation));

    return SUCCEEDED(hr) && m_automation != nullptr;
}

void UiaHelper::ReleaseAutomation() {
    if (m_automation) {
        m_automation->Release();
        m_automation = nullptr;
    }
    if (m_comInitialized) {
        CoUninitialize();
        m_comInitialized = false;
    }
}

bool UiaHelper::IsAvailable() {
    return EnsureAutomation();
}

bool UiaHelper::ReadRuntimeId(IUIAutomationElement* element, std::vector<int>* out) {
    if (!element || !out) return false;
    SAFEARRAY* sa = nullptr;
    if (FAILED(element->GetRuntimeId(&sa)) || !sa) {
        return false;
    }

    LONG lower = 0;
    LONG upper = -1;
    SafeArrayGetLBound(sa, 1, &lower);
    SafeArrayGetUBound(sa, 1, &upper);
    out->clear();
    for (LONG i = lower; i <= upper; ++i) {
        int value = 0;
        SafeArrayGetElement(sa, &i, &value);
        out->push_back(value);
    }
    SafeArrayDestroy(sa);
    return !out->empty();
}

bool UiaHelper::RuntimeIdsEqual(const std::vector<int>& expected, IUIAutomationElement* element) {
    if (expected.empty() || !element) return false;
    std::vector<int> actual;
    if (!ReadRuntimeId(element, &actual)) return false;
    return actual == expected;
}

std::wstring UiaHelper::ReadBstrProperty(IUIAutomationElement* element, PROPERTYID propId) {
    if (!element) return L"";
    VARIANT var = {};
    VariantInit(&var);
    if (FAILED(element->GetCurrentPropertyValue(propId, &var))) {
        return L"";
    }
    std::wstring result;
    if (var.vt == VT_BSTR && var.bstrVal) {
        result = var.bstrVal;
    }
    VariantClear(&var);
    return result;
}

IUIAutomationElement* UiaHelper::FindEditableAtPoint(int x, int y) {
    if (!EnsureAutomation()) return nullptr;

    POINT pt = { x, y };
    IUIAutomationElement* hit = nullptr;
    if (FAILED(m_automation->ElementFromPoint(pt, &hit)) || !hit) {
        return nullptr;
    }

    IUIAutomationElement* current = hit;
    current->AddRef();

    for (int depth = 0; depth < 12 && current; ++depth) {
        BOOL enabled = FALSE;
        current->get_CurrentIsEnabled(&enabled);
        if (enabled) {
            if (PatternAvailable(current, UIA_ValuePatternId) ||
                PatternAvailable(current, UIA_TextPatternId) ||
                PatternAvailable(current, UIA_LegacyIAccessiblePatternId)) {
                IUIAutomationElement* result = current;
                result->AddRef();
                current->Release();
                hit->Release();
                return result;
            }
        }

        IUIAutomationTreeWalker* walker = nullptr;
        if (FAILED(m_automation->get_RawViewWalker(&walker)) || !walker) {
            break;
        }
        IUIAutomationElement* parent = nullptr;
        walker->GetParentElement(current, &parent);
        walker->Release();
        current->Release();
        current = parent;
    }

    // Use hit element even if no pattern found on walk (caller may still try)
    hit->AddRef();
    if (current) current->Release();
    return hit;
}

bool UiaHelper::CaptureAtPoint(int x, int y, UiaTargetSnapshot* out) {
    if (!out) return false;
    *out = UiaTargetSnapshot{};
    out->anchorX = x;
    out->anchorY = y;

    IUIAutomationElement* element = FindEditableAtPoint(x, y);
    if (!element) return false;

    ReadRuntimeId(element, &out->runtimeId);
    out->automationId = ReadBstrProperty(element, UIA_AutomationIdPropertyId);
    out->name = ReadBstrProperty(element, UIA_NamePropertyId);
    out->className = ReadBstrProperty(element, UIA_ClassNamePropertyId);

    CONTROLTYPEID controlType = 0;
    element->get_CurrentControlType(&controlType);
    out->controlType = static_cast<int>(controlType);

    out->nativeHwnd = HwndToWString(ReadNativeHwnd(element));
    out->supportsValue = PatternAvailable(element, UIA_ValuePatternId);
    out->supportsText = PatternAvailable(element, UIA_TextPatternId);

    element->Release();
    return true;
}

IUIAutomationElement* UiaHelper::ResolveTargetElement(const UiaTargetSnapshot& target) {
    if (!EnsureAutomation()) return nullptr;

    POINT pt = { target.anchorX, target.anchorY };
    IUIAutomationElement* fromPoint = nullptr;
    if (SUCCEEDED(m_automation->ElementFromPoint(pt, &fromPoint)) && fromPoint) {
        if (target.runtimeId.empty() || RuntimeIdsEqual(target.runtimeId, fromPoint)) {
            fromPoint->AddRef();
            return fromPoint;
        }

        // Walk up from point hit for matching runtime id
        IUIAutomationElement* current = fromPoint;
        current->AddRef();
        fromPoint->Release();

        for (int depth = 0; depth < 12 && current; ++depth) {
            if (!target.runtimeId.empty() && RuntimeIdsEqual(target.runtimeId, current)) {
                return current;
            }
            IUIAutomationTreeWalker* walker = nullptr;
            if (FAILED(m_automation->get_RawViewWalker(&walker)) || !walker) break;
            IUIAutomationElement* parent = nullptr;
            walker->GetParentElement(current, &parent);
            walker->Release();
            current->Release();
            current = parent;
        }
        if (current) current->Release();
    }

    if (!target.nativeHwnd.empty()) {
        try {
            unsigned long long raw = std::stoull(target.nativeHwnd);
            HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(raw));
            if (hwnd && IsWindow(hwnd)) {
                IUIAutomationElement* fromHwnd = nullptr;
                if (SUCCEEDED(m_automation->ElementFromHandle(hwnd, &fromHwnd)) && fromHwnd) {
                    return fromHwnd;
                }
            }
        } catch (...) {
            // ignore
        }
    }

    return FindEditableAtPoint(target.anchorX, target.anchorY);
}

namespace {

bool AccessibleValueContainsText(const std::wstring& value, const std::wstring& text) {
    if (text.empty()) return false;
    if (value == text) return true;
    return value.find(text) != std::wstring::npos;
}

bool VerifyAccessibleValue(IAccessible* acc, const VARIANT& varChild, const std::wstring& text,
                           const std::wstring& attemptedValue) {
    if (!acc) return false;

    BSTR verifyBstr = nullptr;
    if (FAILED(acc->get_accValue(varChild, &verifyBstr)) || !verifyBstr) {
        // Many Chromium/Electron fields accept put_accValue but do not expose get_accValue.
        return false;
    }

    std::wstring verify(verifyBstr);
    SysFreeString(verifyBstr);

    if (verify == attemptedValue) return true;
    return AccessibleValueContainsText(verify, text);
}

}  // namespace

bool UiaHelper::TryAccessibleSetValueAtPoint(int x, int y, const std::wstring& text) {
    if (text.empty()) return false;

    POINT pt = { x, y };
    IAccessible* acc = nullptr;
    VARIANT varChild;
    VariantInit(&varChild);

    if (FAILED(AccessibleObjectFromPoint(pt, &acc, &varChild)) || !acc) {
        return false;
    }

    std::wstring attemptedValue = text;
    BSTR currentBstr = nullptr;
    if (SUCCEEDED(acc->get_accValue(varChild, &currentBstr)) && currentBstr) {
        std::wstring current(currentBstr);
        SysFreeString(currentBstr);
        if (!current.empty() && !AccessibleValueContainsText(current, text)) {
            attemptedValue = current + text;
        }
    }

    BSTR bstr = SysAllocString(attemptedValue.c_str());
    HRESULT hr = acc->put_accValue(varChild, bstr);
    SysFreeString(bstr);

    if (FAILED(hr)) {
        acc->Release();
        VariantClear(&varChild);
        return false;
    }

    const bool verified = VerifyAccessibleValue(acc, varChild, text, attemptedValue);
    acc->Release();
    VariantClear(&varChild);
    return verified;
}

bool UiaHelper::InsertText(const UiaTargetSnapshot& target, const std::wstring& text) {
    if (text.empty()) return false;

    // MSAA put_accValue at the pinned spot — works in background for many native fields
    if (TryAccessibleSetValueAtPoint(target.anchorX, target.anchorY, text)) {
        return true;
    }

    // Fallback: resolve UIA element and retry at anchor
    IUIAutomationElement* element = ResolveTargetElement(target);
    if (element) {
        element->Release();
    }

    return TryAccessibleSetValueAtPoint(target.anchorX, target.anchorY, text);
}
