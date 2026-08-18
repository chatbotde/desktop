#pragma once

#include <windows.h>
#include <string>
#include <vector>

class FocusTracker {
public:
    struct FocusInfo {
        std::wstring windowTitle;
        std::wstring processName;
        HWND hwnd;
        DWORD processId;
        bool isEditable;
    };

    FocusTracker();
    ~FocusTracker();

    // Get current focus information
    FocusInfo GetCurrentFocus();
    
    // Check if current window is a text input field
    bool IsEditableWindow();
    
    // Get window class name
    std::wstring GetWindowClassName(HWND hwnd);
    
    // Set window to track as "last focused"
    void SetLastFocusedWindow(HWND hwnd);
    
    // Get last focused window info
    FocusInfo GetLastFocusedWindow();
    
    // Bring last focused window to front and focus it
    bool FocusLastWindow();

    // Bring a specific window to front and focus it
    bool FocusWindow(HWND hwnd);
    
    // Check if window handle is valid
    bool IsWindowValid(HWND hwnd);

    // Find visible top-level windows owned by a process name (e.g. "Cursor.exe")
    std::vector<FocusInfo> FindWindowsByProcessName(const std::wstring& processName);

    // Build FocusInfo for an arbitrary HWND
    FocusInfo GetWindowInfo(HWND hwnd);

    // Screen-space bounds for an HWND (physical pixels)
    bool GetWindowRectPx(HWND hwnd, RECT* outRect);

    // Caret position in foreground app (screen px), or mouse cursor as fallback
    bool GetCaretOrCursorPoint(POINT* outPoint);

private:
    bool IsEditableClassName(const std::wstring& className);
    std::wstring GetProcessNameForPid(DWORD processId);
    HWND m_lastFocusedWindow;
};
