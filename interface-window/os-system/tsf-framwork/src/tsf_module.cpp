#include <napi.h>
#include <windows.h>
#include "text_inserter.h"
#include "focus_tracker.h"
#include "uia_helper.h"
#include <memory>
#include <string>
#include <sstream>
#include <cstdint>

// Global instance
std::unique_ptr<TextInserter> g_textInserter;
std::unique_ptr<FocusTracker> g_focusTracker;
std::unique_ptr<UiaHelper> g_uiaHelper;

// Helper function to convert std::wstring to UTF-8 std::string
std::string WStringToUTF8(const std::wstring& wstr) {
    if (wstr.empty()) return std::string();
    
    int sizeNeeded = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), nullptr, 0, nullptr, nullptr);
    std::string result(sizeNeeded, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), &result[0], sizeNeeded, nullptr, nullptr);
    
    return result;
}

// Helper function to convert UTF-8 std::string to std::wstring
std::wstring UTF8ToWString(const std::string& str) {
    if (str.empty()) return std::wstring();
    
    int sizeNeeded = MultiByteToWideChar(CP_UTF8, 0, str.c_str(), (int)str.size(), nullptr, 0);
    std::wstring result(sizeNeeded, 0);
    MultiByteToWideChar(CP_UTF8, 0, str.c_str(), (int)str.size(), &result[0], sizeNeeded);
    
    return result;
}

std::string HwndToString(HWND hwnd) {
    if (!hwnd) return std::string();
    std::ostringstream oss;
    oss << reinterpret_cast<uintptr_t>(hwnd);
    return oss.str();
}

HWND StringToHwnd(const std::string& value) {
    if (value.empty()) return nullptr;
    try {
        unsigned long long raw = std::stoull(value);
        return reinterpret_cast<HWND>(static_cast<uintptr_t>(raw));
    } catch (...) {
        return nullptr;
    }
}

void ClickScreenPoint(int x, int y) {
    SetCursorPos(x, y);
    Sleep(80);

    INPUT inputs[2] = {};
    inputs[0].type = INPUT_MOUSE;
    inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;
    inputs[1].type = INPUT_MOUSE;
    inputs[1].mi.dwFlags = MOUSEEVENTF_LEFTUP;
    SendInput(2, inputs, sizeof(INPUT));
    Sleep(120);
}

Napi::Object FocusInfoToObject(Napi::Env env, const FocusTracker::FocusInfo& focusInfo) {
    Napi::Object result = Napi::Object::New(env);
    result.Set("windowTitle", Napi::String::New(env, WStringToUTF8(focusInfo.windowTitle)));
    result.Set("processName", Napi::String::New(env, WStringToUTF8(focusInfo.processName)));
    result.Set("processId", Napi::Number::New(env, focusInfo.processId));
    result.Set("isEditable", Napi::Boolean::New(env, focusInfo.isEditable));
    result.Set("hwnd", Napi::String::New(env, HwndToString(focusInfo.hwnd)));
    return result;
}

Napi::Object UiaSnapshotToObject(Napi::Env env, const UiaTargetSnapshot& snap) {
    Napi::Object result = Napi::Object::New(env);
    Napi::Array runtimeId = Napi::Array::New(env, snap.runtimeId.size());
    for (size_t i = 0; i < snap.runtimeId.size(); ++i) {
        runtimeId.Set(static_cast<uint32_t>(i), Napi::Number::New(env, snap.runtimeId[i]));
    }
    result.Set("runtimeId", runtimeId);
    result.Set("automationId", Napi::String::New(env, WStringToUTF8(snap.automationId)));
    result.Set("name", Napi::String::New(env, WStringToUTF8(snap.name)));
    result.Set("className", Napi::String::New(env, WStringToUTF8(snap.className)));
    result.Set("controlType", Napi::Number::New(env, snap.controlType));
    result.Set("anchorX", Napi::Number::New(env, snap.anchorX));
    result.Set("anchorY", Napi::Number::New(env, snap.anchorY));
    result.Set("nativeHwnd", Napi::String::New(env, WStringToUTF8(snap.nativeHwnd)));
    result.Set("supportsValue", Napi::Boolean::New(env, snap.supportsValue));
    result.Set("supportsText", Napi::Boolean::New(env, snap.supportsText));
    return result;
}

bool ObjectToUiaSnapshot(Napi::Object obj, UiaTargetSnapshot* out) {
    if (!out) return false;
    *out = UiaTargetSnapshot{};

    if (obj.Has("runtimeId") && obj.Get("runtimeId").IsArray()) {
        Napi::Array arr = obj.Get("runtimeId").As<Napi::Array>();
        for (uint32_t i = 0; i < arr.Length(); ++i) {
            out->runtimeId.push_back(arr.Get(i).As<Napi::Number>().Int32Value());
        }
    }

    if (obj.Has("automationId")) {
        out->automationId = UTF8ToWString(obj.Get("automationId").As<Napi::String>().Utf8Value());
    }
    if (obj.Has("name")) {
        out->name = UTF8ToWString(obj.Get("name").As<Napi::String>().Utf8Value());
    }
    if (obj.Has("className")) {
        out->className = UTF8ToWString(obj.Get("className").As<Napi::String>().Utf8Value());
    }
    if (obj.Has("controlType")) {
        out->controlType = obj.Get("controlType").As<Napi::Number>().Int32Value();
    }
    if (obj.Has("anchorX")) {
        out->anchorX = obj.Get("anchorX").As<Napi::Number>().Int32Value();
    }
    if (obj.Has("anchorY")) {
        out->anchorY = obj.Get("anchorY").As<Napi::Number>().Int32Value();
    }
    if (obj.Has("nativeHwnd")) {
        out->nativeHwnd = UTF8ToWString(obj.Get("nativeHwnd").As<Napi::String>().Utf8Value());
    }
    if (obj.Has("supportsValue")) {
        out->supportsValue = obj.Get("supportsValue").As<Napi::Boolean>().Value();
    }
    if (obj.Has("supportsText")) {
        out->supportsText = obj.Get("supportsText").As<Napi::Boolean>().Value();
    }

    return out->anchorX > 0 || out->anchorY > 0 || !out->runtimeId.empty();
}

UiaHelper* GetUiaHelper() {
    if (!g_uiaHelper) {
        g_uiaHelper = std::make_unique<UiaHelper>();
    }
    return g_uiaHelper.get();
}

Napi::Value IsUiaAvailable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, GetUiaHelper()->IsAvailable());
}

Napi::Value CaptureUiaTargetAt(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        return env.Null();
    }

    UiaTargetSnapshot snap;
    int x = info[0].As<Napi::Number>().Int32Value();
    int y = info[1].As<Napi::Number>().Int32Value();
    if (!GetUiaHelper()->CaptureAtPoint(x, y, &snap)) {
        return env.Null();
    }
    return UiaSnapshotToObject(env, snap);
}

Napi::Value InsertTextViaUia(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsString()) {
        return Napi::Boolean::New(env, false);
    }

    UiaTargetSnapshot snap;
    if (!ObjectToUiaSnapshot(info[0].As<Napi::Object>(), &snap)) {
        return Napi::Boolean::New(env, false);
    }

    std::wstring text = UTF8ToWString(info[1].As<Napi::String>().Utf8Value());
    bool ok = GetUiaHelper()->InsertText(snap, text);
    return Napi::Boolean::New(env, ok);
}

// Initialize the TSF system
Napi::Value Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInserter) {
        g_textInserter = std::make_unique<TextInserter>();
    }
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    bool success = g_textInserter->Initialize();
    
    return Napi::Boolean::New(env, success);
}

// Insert text into the focused application
Napi::Value InsertText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    
    bool success = g_textInserter->InsertText(wtext);
    
    return Napi::Boolean::New(env, success);
}

// Insert text using fallback method (clipboard + paste)
Napi::Value InsertTextFallback(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    
    bool success = g_textInserter->InsertTextFallback(wtext);
    
    return Napi::Boolean::New(env, success);
}

// Get focused window information
Napi::Value GetFocusInfo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    return FocusInfoToObject(env, g_focusTracker->GetCurrentFocus());
}

// Check if TSF is available
Napi::Value IsTsfAvailable(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInserter) {
        return Napi::Boolean::New(env, false);
    }
    
    bool available = g_textInserter->IsTsfAvailable();
    
    return Napi::Boolean::New(env, available);
}

// Check if current window is editable
Napi::Value IsEditableWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    bool editable = g_focusTracker->IsEditableWindow();
    
    return Napi::Boolean::New(env, editable);
}

// Set last focused window (to track before our window gets focus)
// Optional arg: hwnd string. If omitted, uses current foreground window.
Napi::Value SetLastFocusedWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    HWND hwnd = nullptr;
    if (info.Length() >= 1 && info[0].IsString()) {
        hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    } else {
        hwnd = g_focusTracker->GetCurrentFocus().hwnd;
    }

    if (hwnd) {
        g_focusTracker->SetLastFocusedWindow(hwnd);
    }
    
    return env.Undefined();
}

// Get last focused window info
Napi::Value GetLastFocusedWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    return FocusInfoToObject(env, g_focusTracker->GetLastFocusedWindow());
}

// Focus last window
Napi::Value FocusLastWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    bool success = g_focusTracker->FocusLastWindow();
    
    return Napi::Boolean::New(env, success);
}

// Focus a specific window by hwnd string
Napi::Value FocusWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "hwnd string expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    HWND hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    bool success = g_focusTracker->FocusWindow(hwnd);
    return Napi::Boolean::New(env, success);
}

// HWND string for whichever window is currently in the foreground
Napi::Value GetForegroundHwnd(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    HWND hwnd = GetForegroundWindow();
    if (!hwnd || !IsWindow(hwnd)) {
        return env.Null();
    }

    return Napi::String::New(env, HwndToString(hwnd));
}

// Check whether an hwnd string still refers to a live window
Napi::Value IsWindowValid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        return Napi::Boolean::New(env, false);
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    HWND hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    return Napi::Boolean::New(env, g_focusTracker->IsWindowValid(hwnd));
}

// Find visible top-level windows for a process name (e.g. "Cursor.exe")
Napi::Value FindWindowsByProcessName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "processName string expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    std::wstring processName = UTF8ToWString(info[0].As<Napi::String>().Utf8Value());
    auto windows = g_focusTracker->FindWindowsByProcessName(processName);

    Napi::Array result = Napi::Array::New(env, windows.size());
    for (size_t i = 0; i < windows.size(); i++) {
        result.Set(static_cast<uint32_t>(i), FocusInfoToObject(env, windows[i]));
    }
    return result;
}

// Get screen-space window bounds for an hwnd string
// Named GetWindowRectBounds to avoid clashing with Win32 GetWindowRect
Napi::Value GetWindowRectBounds(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        return env.Null();
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    HWND hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    RECT rect = {};
    if (!g_focusTracker->GetWindowRectPx(hwnd, &rect)) {
        return env.Null();
    }

    Napi::Object result = Napi::Object::New(env);
    result.Set("x", Napi::Number::New(env, rect.left));
    result.Set("y", Napi::Number::New(env, rect.top));
    result.Set("width", Napi::Number::New(env, rect.right - rect.left));
    result.Set("height", Napi::Number::New(env, rect.bottom - rect.top));
    return result;
}

// Caret position in foreground app (screen px), or mouse cursor fallback
Napi::Value GetInputAnchor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }

    POINT pt = {};
    if (!g_focusTracker->GetCaretOrCursorPoint(&pt)) {
        return env.Null();
    }

    Napi::Object result = Napi::Object::New(env);
    result.Set("x", Napi::Number::New(env, pt.x));
    result.Set("y", Napi::Number::New(env, pt.y));
    return result;
}

// Focus hwnd then paste text (pin insert path)
Napi::Value FocusHwndAndInsertText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsString() || !info[1].IsString()) {
        Napi::TypeError::New(env, "hwnd and text strings expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }

    HWND hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    if (!g_focusTracker->FocusWindow(hwnd)) {
        return Napi::Boolean::New(env, false);
    }

    Sleep(300);

    std::string text = info[1].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    bool insertSuccess = g_textInserter->InsertTextFallback(wtext);
    return Napi::Boolean::New(env, insertSuccess);
}

// Focus pinned window, click anchor, paste text, optionally restore previous foreground
Napi::Value InsertTextAtPinAnchor(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4 || !info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber() ||
        !info[3].IsString()) {
        Napi::TypeError::New(env, "hwnd, anchorX, anchorY, and text expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }

    HWND hwnd = StringToHwnd(info[0].As<Napi::String>().Utf8Value());
    if (!hwnd || !g_focusTracker->IsWindowValid(hwnd)) {
        return Napi::Boolean::New(env, false);
    }

    const int anchorX = info[1].As<Napi::Number>().Int32Value();
    const int anchorY = info[2].As<Napi::Number>().Int32Value();
    std::wstring wtext = UTF8ToWString(info[3].As<Napi::String>().Utf8Value());

    HWND restoreHwnd = nullptr;
    if (info.Length() >= 5 && info[4].IsString()) {
        restoreHwnd = StringToHwnd(info[4].As<Napi::String>().Utf8Value());
        if (restoreHwnd && !g_focusTracker->IsWindowValid(restoreHwnd)) {
            restoreHwnd = nullptr;
        }
    }

    if (!g_focusTracker->FocusWindow(hwnd)) {
        return Napi::Boolean::New(env, false);
    }

    Sleep(250);
    ClickScreenPoint(anchorX, anchorY);
    g_focusTracker->FocusWindow(hwnd);
    Sleep(150);

    bool insertSuccess = g_textInserter->InsertTextFallbackToHwnd(hwnd, wtext);
    Sleep(400);

    if (restoreHwnd && restoreHwnd != hwnd) {
        g_focusTracker->FocusWindow(restoreHwnd);
    }

    return Napi::Boolean::New(env, insertSuccess);
}

// Focus last window and insert text
Napi::Value FocusAndInsertText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Focus the last window first
    bool focusSuccess = g_focusTracker->FocusLastWindow();
    if (!focusSuccess) {
        return Napi::Boolean::New(env, false);
    }
    
    // Wait for the window to be ready and focused
    // This is critical for apps like Word, Google Docs, etc.
    Sleep(300);
    
    // Insert text using fallback method (clipboard) which works better for Office apps
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    
    // Use fallback method as it's more reliable for Word, Docs, etc.
    bool insertSuccess = g_textInserter->InsertTextFallback(wtext);
    
    return Napi::Boolean::New(env, insertSuccess);
}

// Simulate Ctrl+V (for clipboard fallback)
Napi::Value SimulateCtrlV(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Just simulate the keystrokes (clipboard should already be set)
    g_textInserter->SimulatePaste();
    
    return Napi::Boolean::New(env, true);
}

// Get selected text from focused application
Napi::Value GetSelectedText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::wstring selectedText = g_textInserter->GetSelectedText();
    std::string utf8Text = WStringToUTF8(selectedText);
    
    return Napi::String::New(env, utf8Text);
}

// Replace selected text in focused application
Napi::Value ReplaceSelectedText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    
    bool success = g_textInserter->ReplaceSelectedText(wtext);
    
    return Napi::Boolean::New(env, success);
}

// Focus last window and replace selected text
Napi::Value FocusAndReplaceText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    // Focus the last window first
    bool focusSuccess = g_focusTracker->FocusLastWindow();
    if (!focusSuccess) {
        return Napi::Boolean::New(env, false);
    }
    
    // Wait for the window to be ready and focused
    Sleep(300);
    
    // Replace selected text
    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wtext = UTF8ToWString(text);
    
    bool replaceSuccess = g_textInserter->ReplaceSelectedText(wtext);
    
    return Napi::Boolean::New(env, replaceSuccess);
}

// Delete selected text
Napi::Value DeleteSelection(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_textInserter) {
        Napi::Error::New(env, "TextInserter not initialized").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    bool success = g_textInserter->DeleteSelection();
    
    return Napi::Boolean::New(env, success);
}

// Cleanup
Napi::Value Cleanup(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_textInserter) {
        g_textInserter->Cleanup();
        g_textInserter.reset();
    }
    
    g_focusTracker.reset();
    g_uiaHelper.reset();
    
    return env.Undefined();
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("initialize", Napi::Function::New(env, Initialize));
    exports.Set("insertText", Napi::Function::New(env, InsertText));
    exports.Set("insertTextFallback", Napi::Function::New(env, InsertTextFallback));
    exports.Set("getFocusInfo", Napi::Function::New(env, GetFocusInfo));
    exports.Set("isTsfAvailable", Napi::Function::New(env, IsTsfAvailable));
    exports.Set("isEditableWindow", Napi::Function::New(env, IsEditableWindow));
    exports.Set("setLastFocusedWindow", Napi::Function::New(env, SetLastFocusedWindow));
    exports.Set("getLastFocusedWindow", Napi::Function::New(env, GetLastFocusedWindow));
    exports.Set("focusLastWindow", Napi::Function::New(env, FocusLastWindow));
    exports.Set("focusWindow", Napi::Function::New(env, FocusWindow));
    exports.Set("getForegroundHwnd", Napi::Function::New(env, GetForegroundHwnd));
    exports.Set("isUiaAvailable", Napi::Function::New(env, IsUiaAvailable));
    exports.Set("captureUiaTargetAt", Napi::Function::New(env, CaptureUiaTargetAt));
    exports.Set("insertTextViaUia", Napi::Function::New(env, InsertTextViaUia));
    exports.Set("isWindowValid", Napi::Function::New(env, IsWindowValid));
    exports.Set("findWindowsByProcessName", Napi::Function::New(env, FindWindowsByProcessName));
    exports.Set("getWindowRect", Napi::Function::New(env, GetWindowRectBounds));
    exports.Set("getInputAnchor", Napi::Function::New(env, GetInputAnchor));
    exports.Set("focusAndInsertText", Napi::Function::New(env, FocusAndInsertText));
    exports.Set("focusHwndAndInsertText", Napi::Function::New(env, FocusHwndAndInsertText));
    exports.Set("insertTextAtPinAnchor", Napi::Function::New(env, InsertTextAtPinAnchor));
    exports.Set("simulateCtrlV", Napi::Function::New(env, SimulateCtrlV));
    
    // Text replacement APIs
    exports.Set("getSelectedText", Napi::Function::New(env, GetSelectedText));
    exports.Set("replaceSelectedText", Napi::Function::New(env, ReplaceSelectedText));
    exports.Set("focusAndReplaceText", Napi::Function::New(env, FocusAndReplaceText));
    exports.Set("deleteSelection", Napi::Function::New(env, DeleteSelection));
    
    exports.Set("cleanup", Napi::Function::New(env, Cleanup));
    
    return exports;
}

NODE_API_MODULE(tsf_native, Init)
