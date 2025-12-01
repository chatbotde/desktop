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
    
    // Get selected text from focused application (TSF-aware)
    std::wstring GetSelectedText();
    
    // Replace selected text in focused application
    bool ReplaceSelectedText(const std::wstring& text);
    
    // Delete selected text
    bool DeleteSelection();
    
    // Insert text using fallback methods (clipboard + paste)
    bool InsertTextFallback(const std::wstring& text);
    
    // Replace text using fallback methods (clipboard + paste)
    bool ReplaceTextFallback(const std::wstring& text);
    
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
    
    // TSF Range and Selection helpers
    bool GetCurrentSelection(ITfContext* pContext, TfEditCookie ec, ITfRange** ppRange);
    bool GetTextFromRange(ITfRange* pRange, TfEditCookie ec, std::wstring& text);
    bool SetTextInRange(ITfRange* pRange, TfEditCookie ec, const std::wstring& text);
    
    // Edit Session implementation for async text operations
    class TextEditSession;
    friend class TextEditSession;
};
