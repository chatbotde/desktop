#pragma once

#include <windows.h>
#include <string>

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
    
    // Check if window handle is valid
    bool IsWindowValid(HWND hwnd);

private:
    bool IsEditableClassName(const std::wstring& className);
    HWND m_lastFocusedWindow;
};
