#ifndef INPUT_METHOD_CONTROLLER_H
#define INPUT_METHOD_CONTROLLER_H

#include <nan.h>

namespace InputMethodController {

void Init(v8::Local<v8::Object> exports);
v8::Local<v8::Value> InsertText(const char *text);
void InsertTextWithTyping(const char *text, int delayMs, Nan::Callback *callback);
v8::Local<v8::Value> GetSelectedText();
v8::Local<v8::Value> ReplaceSelectedText(const char *text);
v8::Local<v8::Object> GetActiveApplication();
v8::Local<v8::Value> IsTextInputActive();

} // namespace InputMethodController

#endif // INPUT_METHOD_CONTROLLER_H
