#include "focus_tracker.h"
#include <psapi.h>
#include <vector>

FocusTracker::FocusTracker() : m_lastFocusedWindow(nullptr) {
}

FocusTracker::~FocusTracker() {
}

FocusTracker::FocusInfo FocusTracker::GetCurrentFocus() {
    FocusInfo info = {};
    
    info.hwnd = GetForegroundWindow();
    if (!info.hwnd) {
        return info;
    }

    // Get window title
    wchar_t title[256] = {0};
    GetWindowTextW(info.hwnd, title, sizeof(title) / sizeof(wchar_t));
    info.windowTitle = title;

    // Get process ID and name
    GetWindowThreadProcessId(info.hwnd, &info.processId);
    
    if (info.processId != 0) {
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, info.processId);
        if (hProcess) {
            wchar_t processName[MAX_PATH] = {0};
            DWORD size = MAX_PATH;
            
            if (QueryFullProcessImageNameW(hProcess, 0, processName, &size)) {
                std::wstring fullPath(processName);
                size_t lastSlash = fullPath.find_last_of(L"\\/");
                if (lastSlash != std::wstring::npos) {
                    info.processName = fullPath.substr(lastSlash + 1);
                } else {
                    info.processName = fullPath;
                }
            }
            
            CloseHandle(hProcess);
        }
    }

    // Check if window is editable
    info.isEditable = IsEditableWindow();

    return info;
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
    FocusInfo info = {};
    
    if (!m_lastFocusedWindow || !IsWindow(m_lastFocusedWindow)) {
        return info;
    }
    
    info.hwnd = m_lastFocusedWindow;
    
    // Get window title
    wchar_t title[256] = {0};
    GetWindowTextW(m_lastFocusedWindow, title, sizeof(title) / sizeof(wchar_t));
    info.windowTitle = title;
    
    // Get process ID and name
    GetWindowThreadProcessId(m_lastFocusedWindow, &info.processId);
    
    if (info.processId != 0) {
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, info.processId);
        if (hProcess) {
            wchar_t processName[MAX_PATH] = {0};
            DWORD size = MAX_PATH;
            
            if (QueryFullProcessImageNameW(hProcess, 0, processName, &size)) {
                std::wstring fullPath(processName);
                size_t lastSlash = fullPath.find_last_of(L"\\/");
                if (lastSlash != std::wstring::npos) {
                    info.processName = fullPath.substr(lastSlash + 1);
                } else {
                    info.processName = fullPath;
                }
            }
            
            CloseHandle(hProcess);
        }
    }
    
    return info;
}

bool FocusTracker::FocusLastWindow() {
    if (!m_lastFocusedWindow || !IsWindow(m_lastFocusedWindow)) {
        return false;
    }
    
    // Check if window is minimized
    if (IsIconic(m_lastFocusedWindow)) {
        ShowWindow(m_lastFocusedWindow, SW_RESTORE);
    }
    
    // Bring window to front
    SetForegroundWindow(m_lastFocusedWindow);
    
    // Small delay to ensure focus is set
    Sleep(50);
    
    // Set focus to the window
    SetFocus(m_lastFocusedWindow);
    
    return true;
}

bool FocusTracker::IsWindowValid(HWND hwnd) {
    return hwnd != nullptr && IsWindow(hwnd);
}
