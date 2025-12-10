#include <napi.h>
#include <windows.h>
#include "text_inserter.h"
#include "focus_tracker.h"
#include <memory>
#include <string>

// Global instance
std::unique_ptr<TextInserter> g_textInserter;
std::unique_ptr<FocusTracker> g_focusTracker;

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
    
    auto focusInfo = g_focusTracker->GetCurrentFocus();
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("windowTitle", Napi::String::New(env, WStringToUTF8(focusInfo.windowTitle)));
    result.Set("processName", Napi::String::New(env, WStringToUTF8(focusInfo.processName)));
    result.Set("processId", Napi::Number::New(env, focusInfo.processId));
    result.Set("isEditable", Napi::Boolean::New(env, focusInfo.isEditable));
    
    return result;
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
Napi::Value SetLastFocusedWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    // Get current focused window and store it
    auto focusInfo = g_focusTracker->GetCurrentFocus();
    if (focusInfo.hwnd) {
        g_focusTracker->SetLastFocusedWindow(focusInfo.hwnd);
    }
    
    return env.Undefined();
}

// Get last focused window info
Napi::Value GetLastFocusedWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (!g_focusTracker) {
        g_focusTracker = std::make_unique<FocusTracker>();
    }
    
    auto focusInfo = g_focusTracker->GetLastFocusedWindow();
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("windowTitle", Napi::String::New(env, WStringToUTF8(focusInfo.windowTitle)));
    result.Set("processName", Napi::String::New(env, WStringToUTF8(focusInfo.processName)));
    result.Set("processId", Napi::Number::New(env, focusInfo.processId));
    result.Set("isEditable", Napi::Boolean::New(env, focusInfo.isEditable));
    
    return result;
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
    exports.Set("focusAndInsertText", Napi::Function::New(env, FocusAndInsertText));
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
