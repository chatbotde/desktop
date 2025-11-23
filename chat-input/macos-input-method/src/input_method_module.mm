#include <nan.h>
#include "input_method_controller.h"
#include "text_inserter.h"

using v8::FunctionTemplate;
using v8::Function;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

// Wrapper class for the InputMethodController
class InputMethodControllerWrapper : public Nan::ObjectWrap {
public:
    static NAN_MODULE_INIT(Init) {
        Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);
        tpl->SetClassName(Nan::New("InputMethodController").ToLocalChecked());
        tpl->InstanceTemplate()->SetInternalFieldCount(1);

        // Prototype methods
        Nan::SetPrototypeMethod(tpl, "insertText", InsertText);
        Nan::SetPrototypeMethod(tpl, "insertTextWithTyping", InsertTextWithTyping);
        Nan::SetPrototypeMethod(tpl, "getSelectedText", GetSelectedText);
        Nan::SetPrototypeMethod(tpl, "replaceSelectedText", ReplaceSelectedText);
        Nan::SetPrototypeMethod(tpl, "getActiveApplication", GetActiveApplication);
        Nan::SetPrototypeMethod(tpl, "isTextInputActive", IsTextInputActive);
        Nan::SetPrototypeMethod(tpl, "sendKeyboardShortcut", SendKeyboardShortcut);
        Nan::SetPrototypeMethod(tpl, "getCursorPosition", GetCursorPosition);
        Nan::SetPrototypeMethod(tpl, "startMonitoring", StartMonitoring);
        Nan::SetPrototypeMethod(tpl, "stopMonitoring", StopMonitoring);
        Nan::SetPrototypeMethod(tpl, "checkAccessibilityPermissions", CheckAccessibilityPermissions);

        constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
        Nan::Set(target, Nan::New("InputMethodController").ToLocalChecked(),
                 Nan::GetFunction(tpl).ToLocalChecked());
    }

private:
    explicit InputMethodControllerWrapper() {}
    ~InputMethodControllerWrapper() {}

    static NAN_METHOD(New) {
        if (info.IsConstructCall()) {
            InputMethodControllerWrapper *obj = new InputMethodControllerWrapper();
            obj->Wrap(info.This());
            info.GetReturnValue().Set(info.This());
        } else {
            const int argc = 0;
            Local<Value> argv[argc] = {};
            Local<Function> cons = Nan::New(constructor());
            info.GetReturnValue().Set(Nan::NewInstance(cons, argc, argv).ToLocalChecked());
        }
    }

    static NAN_METHOD(InsertText) {
        if (info.Length() < 1 || !info[0]->IsString()) {
            Nan::ThrowTypeError("Text argument required");
            return;
        }

        Nan::Utf8String text(info[0]);
        Local<Value> result = InputMethodController::InsertText(*text);
        info.GetReturnValue().Set(result);
    }

    static NAN_METHOD(InsertTextWithTyping) {
        if (info.Length() < 3 || !info[0]->IsString() || !info[1]->IsNumber() || !info[2]->IsFunction()) {
            Nan::ThrowTypeError("Arguments: text (string), delay (number), callback (function)");
            return;
        }

        Nan::Utf8String text(info[0]);
        int delay = Nan::To<int>(info[1]).FromJust();
        Nan::Callback *callback = new Nan::Callback(info[2].As<Function>());

        InputMethodController::InsertTextWithTyping(*text, delay, callback);
    }

    static NAN_METHOD(GetSelectedText) {
        Local<Value> result = InputMethodController::GetSelectedText();
        info.GetReturnValue().Set(result);
    }

    static NAN_METHOD(ReplaceSelectedText) {
        if (info.Length() < 1 || !info[0]->IsString()) {
            Nan::ThrowTypeError("Text argument required");
            return;
        }

        Nan::Utf8String text(info[0]);
        Local<Value> result = InputMethodController::ReplaceSelectedText(*text);
        info.GetReturnValue().Set(result);
    }

    static NAN_METHOD(GetActiveApplication) {
        Local<Object> result = InputMethodController::GetActiveApplication();
        info.GetReturnValue().Set(result);
    }

    static NAN_METHOD(IsTextInputActive) {
        Local<Value> result = InputMethodController::IsTextInputActive();
        info.GetReturnValue().Set(result);
    }

    static NAN_METHOD(SendKeyboardShortcut) {
        if (info.Length() < 2 || !info[0]->IsString() || !info[1]->IsObject()) {
            Nan::ThrowTypeError("Arguments: key (string), modifiers (object)");
            return;
        }

        // Implementation would call bridge method
        info.GetReturnValue().Set(Nan::New(true));
    }

    static NAN_METHOD(GetCursorPosition) {
        CGPoint position = [TextInserter getCursorPosition];
        
        if (position.x < 0 || position.y < 0) {
            info.GetReturnValue().Set(Nan::Null());
        } else {
            Local<Object> obj = Nan::New<Object>();
            Nan::Set(obj, Nan::New("x").ToLocalChecked(), Nan::New(position.x));
            Nan::Set(obj, Nan::New("y").ToLocalChecked(), Nan::New(position.y));
            info.GetReturnValue().Set(obj);
        }
    }

    static NAN_METHOD(StartMonitoring) {
        if (info.Length() < 1 || !info[0]->IsFunction()) {
            Nan::ThrowTypeError("Callback function required");
            return;
        }

        // Store callback and start monitoring
        info.GetReturnValue().Set(Nan::New(true));
    }

    static NAN_METHOD(StopMonitoring) {
        // Stop monitoring implementation
        info.GetReturnValue().Set(Nan::New(true));
    }

    static NAN_METHOD(CheckAccessibilityPermissions) {
        BOOL hasPermission = [TextInserter checkAccessibilityPermissions];
        info.GetReturnValue().Set(Nan::New(hasPermission));
    }

    static inline Nan::Persistent<Function> & constructor() {
        static Nan::Persistent<Function> my_constructor;
        return my_constructor;
    }
};

NAN_MODULE_INIT(InitModule) {
    InputMethodController::Init(target);
    InputMethodControllerWrapper::Init(target);
}

NODE_MODULE(macos_input_method, InitModule)
