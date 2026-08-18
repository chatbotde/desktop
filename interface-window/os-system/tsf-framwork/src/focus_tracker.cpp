#include "focus_tracker.h"
#include <psapi.h>
#include <vector>
#include <algorithm>

namespace {

struct EnumFindContext {
    std::wstring processNameLower;
    std::vector<FocusTracker::FocusInfo>* results;
    FocusTracker* tracker;
};

std::wstring ToLower(std::wstring value) {
    std::transform(value.begin(), value.end(), value.begin(), ::towlower);
    return value;
}

BOOL CALLBACK EnumWindowsForProcessProc(HWND hwnd, LPARAM lParam) {
    auto* ctx = reinterpret_cast<EnumFindContext*>(lParam);
    if (!ctx || !ctx->results || !ctx->tracker) {
        return TRUE;
    }

    if (!IsWindowVisible(hwnd)) {
        return TRUE;
    }

    // Skip owned/tool windows without a title bar when possible
    if (GetWindow(hwnd, GW_OWNER) != nullptr) {
        return TRUE;
    }

    LONG style = GetWindowLongW(hwnd, GWL_STYLE);
    if (!(style & WS_VISIBLE)) {
        return TRUE;
    }

    wchar_t title[256] = {0};
    GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t));
    if (title[0] == L'\0') {
        return TRUE;
    }

    FocusTracker::FocusInfo info = ctx->tracker->GetWindowInfo(hwnd);
    if (info.processName.empty()) {
        return TRUE;
    }

    if (ToLower(info.processName) == ctx->processNameLower) {
        ctx->results->push_back(info);
    }

    return TRUE;
}

} // namespace

FocusTracker::FocusTracker() : m_lastFocusedWindow(nullptr) {
}

FocusTracker::~FocusTracker() {
}

std::wstring FocusTracker::GetProcessNameForPid(DWORD processId) {
    if (processId == 0) {
        return L"";
    }

    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);
    if (!hProcess) {
        // Fallback for some protected processes
        hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
    }
    if (!hProcess) {
        return L"";
    }

    wchar_t processName[MAX_PATH] = {0};
    DWORD size = MAX_PATH;
    std::wstring result;

    if (QueryFullProcessImageNameW(hProcess, 0, processName, &size)) {
        std::wstring fullPath(processName);
        size_t lastSlash = fullPath.find_last_of(L"\\/");
        if (lastSlash != std::wstring::npos) {
            result = fullPath.substr(lastSlash + 1);
        } else {
            result = fullPath;
        }
    }

    CloseHandle(hProcess);
    return result;
}

FocusTracker::FocusInfo FocusTracker::GetWindowInfo(HWND hwnd) {
    FocusInfo info = {};
    if (!hwnd || !IsWindow(hwnd)) {
        return info;
    }

    info.hwnd = hwnd;

    wchar_t title[256] = {0};
    GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t));
    info.windowTitle = title;

    GetWindowThreadProcessId(hwnd, &info.processId);
    info.processName = GetProcessNameForPid(info.processId);

    std::wstring className = GetWindowClassName(hwnd);
    info.isEditable = IsEditableClassName(className);

    return info;
}

FocusTracker::FocusInfo FocusTracker::GetCurrentFocus() {
    HWND hwnd = GetForegroundWindow();
    return GetWindowInfo(hwnd);
}

bool FocusTracker::IsEditableWindow() {
    HWND hwnd = GetFocus();
    if (!hwnd) {
        hwnd = GetForegroundWindow();
    }
    
    if (!hwnd) {
        return false;
    }

    std::wstring className = GetWindowClassName(hwnd);
    return IsEditableClassName(className);
}

std::wstring FocusTracker::GetWindowClassName(HWND hwnd) {
    if (!hwnd) {
        return L"";
    }

    wchar_t className[256] = {0};
    GetClassNameW(hwnd, className, sizeof(className) / sizeof(wchar_t));
    
    return std::wstring(className);
}

bool FocusTracker::IsEditableClassName(const std::wstring& className) {
    // Common editable window class names
    std::vector<std::wstring> editableClasses = {
        L"Edit",
        L"RichEdit",
        L"RichEdit20A",
        L"RichEdit20W",
        L"RichEdit50W",
        L"RICHEDIT",
        L"RICHEDIT50W",
        L"TextBox",
        L"ConsoleWindowClass",
        L"Chrome_RenderWidgetHostHWND",  // Chrome/Edge text fields
        L"Chrome_WidgetWin_1",
        L"MozillaWindowClass",           // Firefox
        L"Qt5QWindowIcon",                // Qt apps
        L"SunAwtFrame",                   // Java apps
        L"XLMAIN",                        // Excel
        L"OpusApp",                       // Word
        L"Notepad",
    };

    for (const auto& editableClass : editableClasses) {
        if (className.find(editableClass) != std::wstring::npos) {
            return true;
        }
    }

    return false;
}

void FocusTracker::SetLastFocusedWindow(HWND hwnd) {
    if (hwnd && IsWindow(hwnd)) {
        m_lastFocusedWindow = hwnd;
    }
}

FocusTracker::FocusInfo FocusTracker::GetLastFocusedWindow() {
    return GetWindowInfo(m_lastFocusedWindow);
}

bool FocusTracker::FocusWindow(HWND hwnd) {
    if (!hwnd || !IsWindow(hwnd)) {
        return false;
    }

    if (IsIconic(hwnd)) {
        ShowWindow(hwnd, SW_RESTORE);
    }

    HWND foreground = GetForegroundWindow();
    DWORD targetThread = GetWindowThreadProcessId(hwnd, nullptr);
    DWORD foregroundThread = foreground ? GetWindowThreadProcessId(foreground, nullptr) : 0;
    DWORD currentThread = GetCurrentThreadId();

    bool attachedForeground = false;
    bool attachedTarget = false;

    if (foregroundThread && foregroundThread != currentThread) {
        attachedForeground = AttachThreadInput(currentThread, foregroundThread, TRUE) != 0;
    }
    if (targetThread && targetThread != currentThread && targetThread != foregroundThread) {
        attachedTarget = AttachThreadInput(currentThread, targetThread, TRUE) != 0;
    }

    BringWindowToTop(hwnd);
    ShowWindow(hwnd, SW_SHOW);
    BOOL focused = SetForegroundWindow(hwnd);
    SetFocus(hwnd);

    if (attachedTarget) {
        AttachThreadInput(currentThread, targetThread, FALSE);
    }
    if (attachedForeground) {
        AttachThreadInput(currentThread, foregroundThread, FALSE);
    }

    // Allow a brief settle even if SetForegroundWindow reports false
    // (Windows foreground lock can lie while still switching).
    Sleep(50);
    return focused || GetForegroundWindow() == hwnd;
}

bool FocusTracker::FocusLastWindow() {
    return FocusWindow(m_lastFocusedWindow);
}

bool FocusTracker::IsWindowValid(HWND hwnd) {
    return hwnd != nullptr && IsWindow(hwnd);
}

bool FocusTracker::GetWindowRectPx(HWND hwnd, RECT* outRect) {
    if (!hwnd || !outRect || !IsWindow(hwnd)) {
        return false;
    }
    return GetWindowRect(hwnd, outRect) != 0;
}

bool FocusTracker::GetCaretOrCursorPoint(POINT* outPoint) {
    if (!outPoint) {
        return false;
    }

    HWND hwnd = GetForegroundWindow();
    if (hwnd) {
        DWORD threadId = GetWindowThreadProcessId(hwnd, nullptr);
        GUITHREADINFO gti = {};
        gti.cbSize = sizeof(GUITHREADINFO);

        if (GetGUIThreadInfo(threadId, &gti) && !IsRectEmpty(&gti.rcCaret)) {
            outPoint->x = gti.rcCaret.left;
            outPoint->y = gti.rcCaret.top;
            return true;
        }
    }

    return GetCursorPos(outPoint) != 0;
}

std::vector<FocusTracker::FocusInfo> FocusTracker::FindWindowsByProcessName(const std::wstring& processName) {
    std::vector<FocusInfo> results;
    if (processName.empty()) {
        return results;
    }

    EnumFindContext ctx;
    ctx.processNameLower = ToLower(processName);
    ctx.results = &results;
    ctx.tracker = this;

    EnumWindows(EnumWindowsForProcessProc, reinterpret_cast<LPARAM>(&ctx));
    return results;
}
