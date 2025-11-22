#include "text_inserter.h"
#include <comdef.h>
#include <psapi.h>
#include <tlhelp32.h>

TextInserter::TextInserter()
    : m_pThreadMgr(nullptr)
    , m_clientId(TF_CLIENTID_NULL)
    , m_initialized(false) {
}

TextInserter::~TextInserter() {
    Cleanup();
}

bool TextInserter::Initialize() {
    if (m_initialized) {
        return true;
    }

    if (!InitializeCOM()) {
        return false;
    }

    if (!CreateThreadManager()) {
        return false;
    }

    m_initialized = true;
    return true;
}

bool TextInserter::InitializeCOM() {
    HRESULT hr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    if (FAILED(hr) && hr != RPC_E_CHANGED_MODE) {
        return false;
    }
    return true;
}

bool TextInserter::CreateThreadManager() {
    HRESULT hr = CoCreateInstance(
        CLSID_TF_ThreadMgr,
        nullptr,
        CLSCTX_INPROC_SERVER,
        IID_ITfThreadMgr,
        (void**)&m_pThreadMgr
    );

    if (FAILED(hr)) {
        return false;
    }

    hr = m_pThreadMgr->Activate(&m_clientId);
    if (FAILED(hr)) {
        m_pThreadMgr->Release();
        m_pThreadMgr = nullptr;
        return false;
    }

    return true;
}

bool TextInserter::InsertText(const std::wstring& text) {
    if (!m_initialized || text.empty()) {
        return false;
    }

    // Get the document manager for the focused thread
    ITfDocumentMgr* pDocMgr = nullptr;
    HRESULT hr = m_pThreadMgr->GetFocus(&pDocMgr);
    
    if (FAILED(hr) || !pDocMgr) {
        // TSF not available, use fallback
        return InsertTextFallback(text);
    }

    // Get the context from the document manager
    ITfContext* pContext = nullptr;
    hr = pDocMgr->GetTop(&pContext);
    
    if (FAILED(hr) || !pContext) {
        pDocMgr->Release();
        return InsertTextFallback(text);
    }

    // Get the insertion point
    ITfRange* pRange = nullptr;
    TfEditCookie ec = 0; // Initialize to avoid warning
    
    // Request a write lock on the context
    ITfEditSession* pEditSession = nullptr;
    
    // For simplicity, we'll use the insertion point approach
    // In a full implementation, you'd create a proper edit session
    
    // Try to get the selection
    TF_SELECTION tfSelection;
    ULONG cFetched = 0;
    
    hr = pContext->GetSelection(ec, TF_DEFAULT_SELECTION, 1, &tfSelection, &cFetched);
    
    if (SUCCEEDED(hr) && cFetched > 0) {
        pRange = tfSelection.range;
        
        // Insert text at the selection/cursor position
        hr = pRange->SetText(ec, TF_ST_CORRECTION, text.c_str(), (LONG)text.length());
        
        pRange->Release();
    }
    
    pContext->Release();
    pDocMgr->Release();

    if (FAILED(hr)) {
        // If TSF insertion failed, use fallback
        return InsertTextFallback(text);
    }

    return true;
}

bool TextInserter::InsertTextFallback(const std::wstring& text) {
    if (text.empty()) {
        return false;
    }

    // Get the foreground window to ensure focus
    HWND hwndTarget = GetForegroundWindow();
    if (!hwndTarget) {
        return false;
    }

    // Save current clipboard content
    if (!OpenClipboard(nullptr)) {
        // Retry once after a short delay
        Sleep(50);
        if (!OpenClipboard(nullptr)) {
            return false;
        }
    }

    HANDLE hOldData = GetClipboardData(CF_UNICODETEXT);
    std::wstring oldClipboard;
    
    if (hOldData) {
        wchar_t* pOldData = (wchar_t*)GlobalLock(hOldData);
        if (pOldData) {
            oldClipboard = pOldData;
            GlobalUnlock(hOldData);
        }
    }

    // Set new clipboard content
    EmptyClipboard();
    
    size_t size = (text.length() + 1) * sizeof(wchar_t);
    HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, size);
    
    if (!hMem) {
        CloseClipboard();
        return false;
    }

    wchar_t* pMem = (wchar_t*)GlobalLock(hMem);
    if (!pMem) {
        GlobalFree(hMem);
        CloseClipboard();
        return false;
    }

    wcscpy_s(pMem, text.length() + 1, text.c_str());
    GlobalUnlock(hMem);

    if (!SetClipboardData(CF_UNICODETEXT, hMem)) {
        GlobalFree(hMem);
        CloseClipboard();
        return false;
    }

    CloseClipboard();

    // Ensure target window still has focus
    SetForegroundWindow(hwndTarget);
    
    // Wait for clipboard to be ready and window to be focused
    Sleep(100);

    // Simulate Ctrl+V with proper timing
    SimulatePaste();

    // Wait for paste to complete (important for large text or slow apps)
    Sleep(200);

    // Restore old clipboard content
    if (!oldClipboard.empty()) {
        // Try to open clipboard with retries
        int retries = 3;
        while (retries > 0 && !OpenClipboard(nullptr)) {
            Sleep(50);
            retries--;
        }
        
        if (retries > 0) {
            EmptyClipboard();
            
            size_t oldSize = (oldClipboard.length() + 1) * sizeof(wchar_t);
            HGLOBAL hOldMem = GlobalAlloc(GMEM_MOVEABLE, oldSize);
            
            if (hOldMem) {
                wchar_t* pOldMem = (wchar_t*)GlobalLock(hOldMem);
                if (pOldMem) {
                    wcscpy_s(pOldMem, oldClipboard.length() + 1, oldClipboard.c_str());
                    GlobalUnlock(hOldMem);
                    SetClipboardData(CF_UNICODETEXT, hOldMem);
                }
            }
            
            CloseClipboard();
        }
    }

    return true;
}

void TextInserter::SimulatePaste() {
    // Send Ctrl+V keystrokes
    INPUT inputs[4] = {};
    
    // Press Ctrl
    inputs[0].type = INPUT_KEYBOARD;
    inputs[0].ki.wVk = VK_CONTROL;
    
    // Press V
    inputs[1].type = INPUT_KEYBOARD;
    inputs[1].ki.wVk = 'V';
    
    // Release V
    inputs[2].type = INPUT_KEYBOARD;
    inputs[2].ki.wVk = 'V';
    inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    
    // Release Ctrl
    inputs[3].type = INPUT_KEYBOARD;
    inputs[3].ki.wVk = VK_CONTROL;
    inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;
    
    SendInput(4, inputs, sizeof(INPUT));
}

std::wstring TextInserter::GetFocusedWindowTitle() {
    HWND hwnd = GetForegroundWindow();
    if (!hwnd) {
        return L"";
    }

    wchar_t title[256] = {0};
    GetWindowTextW(hwnd, title, sizeof(title) / sizeof(wchar_t));
    
    return std::wstring(title);
}

std::wstring TextInserter::GetFocusedProcessName() {
    HWND hwnd = GetForegroundWindow();
    if (!hwnd) {
        return L"";
    }

    DWORD processId = 0;
    GetWindowThreadProcessId(hwnd, &processId);
    
    if (processId == 0) {
        return L"";
    }

    HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processId);
    if (!hProcess) {
        return L"";
    }

    wchar_t processName[MAX_PATH] = {0};
    DWORD size = MAX_PATH;
    
    if (QueryFullProcessImageNameW(hProcess, 0, processName, &size)) {
        CloseHandle(hProcess);
        
        // Extract just the filename
        std::wstring fullPath(processName);
        size_t lastSlash = fullPath.find_last_of(L"\\/");
        if (lastSlash != std::wstring::npos) {
            return fullPath.substr(lastSlash + 1);
        }
        return fullPath;
    }

    CloseHandle(hProcess);
    return L"";
}

bool TextInserter::IsTsfAvailable() {
    if (!m_initialized) {
        return false;
    }

    ITfDocumentMgr* pDocMgr = nullptr;
    HRESULT hr = m_pThreadMgr->GetFocus(&pDocMgr);
    
    if (FAILED(hr) || !pDocMgr) {
        return false;
    }

    pDocMgr->Release();
    return true;
}

void TextInserter::Cleanup() {
    if (m_pThreadMgr) {
        if (m_clientId != TF_CLIENTID_NULL) {
            m_pThreadMgr->Deactivate();
            m_clientId = TF_CLIENTID_NULL;
        }
        m_pThreadMgr->Release();
        m_pThreadMgr = nullptr;
    }
    
    m_initialized = false;
    CoUninitialize();
}
