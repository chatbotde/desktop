#pragma once

#include <windows.h>
#include <msctf.h>
#include <string>
#include <vector>

class TextInserter {
public:
    TextInserter();
    ~TextInserter();

    // Initialize TSF
    bool Initialize();
    
    // Insert text at current cursor position in focused app
    bool InsertText(const std::wstring& text);
    
    // Insert text using fallback methods (clipboard + paste)
    bool InsertTextFallback(const std::wstring& text);
    
    // Get current focused window info
    std::wstring GetFocusedWindowTitle();
    std::wstring GetFocusedProcessName();
    
    // Check if TSF is available in the focused application
    bool IsTsfAvailable();
    
    // Simulate Ctrl+V keystroke
    void SimulatePaste();
    
    // Cleanup
    void Cleanup();

private:
    ITfThreadMgr* m_pThreadMgr;
    TfClientId m_clientId;
    bool m_initialized;
    
    // Helper methods
    bool InitializeCOM();
    bool CreateThreadManager();
    void SendKeystroke(WORD vkKey, bool shift = false);
};
