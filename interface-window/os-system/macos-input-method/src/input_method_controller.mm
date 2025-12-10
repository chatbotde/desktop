#import <Cocoa/Cocoa.h>
#import <Carbon/Carbon.h>
#import <InputMethodKit/InputMethodKit.h>
#include <nan.h>
#include "input_method_controller.h"

using v8::FunctionTemplate;
using v8::Function;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Boolean;
using v8::Number;
using v8::Value;
using v8::Array;

@interface InputMethodBridge : NSObject
@property (nonatomic, strong) NSRunningApplication *activeApp;
@property (nonatomic, assign) BOOL isMonitoring;
@property (nonatomic, copy) void (^eventCallback)(NSDictionary *);
@end

@implementation InputMethodBridge

- (instancetype)init {
    self = [super init];
    if (self) {
        _isMonitoring = NO;
    }
    return self;
}

- (BOOL)insertText:(NSString *)text {
    @autoreleasepool {
        // Get the current event source
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        
        // Convert NSString to unichar array
        NSUInteger length = [text length];
        unichar *buffer = (unichar *)malloc(length * sizeof(unichar));
        [text getCharacters:buffer range:NSMakeRange(0, length)];
        
        BOOL success = YES;
        
        for (NSUInteger i = 0; i < length; i++) {
            CGEventRef keyDown = CGEventCreateKeyboardEvent(source, 0, true);
            CGEventRef keyUp = CGEventCreateKeyboardEvent(source, 0, false);
            
            if (keyDown && keyUp) {
                CGEventKeyboardSetUnicodeString(keyDown, 1, &buffer[i]);
                CGEventKeyboardSetUnicodeString(keyUp, 1, &buffer[i]);
                
                CGEventPost(kCGHIDEventTap, keyDown);
                CGEventPost(kCGHIDEventTap, keyUp);
                
                CFRelease(keyDown);
                CFRelease(keyUp);
            } else {
                success = NO;
                break;
            }
        }
        
        free(buffer);
        CFRelease(source);
        
        return success;
    }
}

- (void)insertTextWithTyping:(NSString *)text delay:(NSTimeInterval)delay completion:(void (^)(BOOL))completion {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        @autoreleasepool {
            CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
            NSUInteger length = [text length];
            unichar *buffer = (unichar *)malloc(length * sizeof(unichar));
            [text getCharacters:buffer range:NSMakeRange(0, length)];
            
            BOOL success = YES;
            
            for (NSUInteger i = 0; i < length; i++) {
                CGEventRef keyDown = CGEventCreateKeyboardEvent(source, 0, true);
                CGEventRef keyUp = CGEventCreateKeyboardEvent(source, 0, false);
                
                if (keyDown && keyUp) {
                    CGEventKeyboardSetUnicodeString(keyDown, 1, &buffer[i]);
                    CGEventKeyboardSetUnicodeString(keyUp, 1, &buffer[i]);
                    
                    CGEventPost(kCGHIDEventTap, keyDown);
                    CGEventPost(kCGHIDEventTap, keyUp);
                    
                    CFRelease(keyDown);
                    CFRelease(keyUp);
                    
                    // Add delay between characters
                    [NSThread sleepForTimeInterval:delay];
                } else {
                    success = NO;
                    break;
                }
            }
            
            free(buffer);
            CFRelease(source);
            
            dispatch_async(dispatch_get_main_queue(), ^{
                if (completion) completion(success);
            });
        }
    });
}

- (NSString *)getSelectedText {
    @autoreleasepool {
        // Simulate Cmd+C to copy selected text
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        
        // Clear clipboard first
        NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
        NSString *previousContent = [pasteboard stringForType:NSPasteboardTypeString];
        [pasteboard clearContents];
        
        // Send Cmd+C
        CGEventRef cmdCDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)8, true); // C key
        CGEventRef cmdCUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)8, false);
        CGEventSetFlags(cmdCDown, kCGEventFlagMaskCommand);
        CGEventSetFlags(cmdCUp, kCGEventFlagMaskCommand);
        
        CGEventPost(kCGHIDEventTap, cmdCDown);
        CGEventPost(kCGHIDEventTap, cmdCUp);
        
        CFRelease(cmdCDown);
        CFRelease(cmdCUp);
        CFRelease(source);
        
        // Wait for clipboard to update
        [NSThread sleepForTimeInterval:0.1];
        
        NSString *selectedText = [pasteboard stringForType:NSPasteboardTypeString];
        
        // Restore previous clipboard content
        if (previousContent) {
            [pasteboard clearContents];
            [pasteboard setString:previousContent forType:NSPasteboardTypeString];
        }
        
        return selectedText ?: @"";
    }
}

- (BOOL)replaceSelectedText:(NSString *)text {
    @autoreleasepool {
        // Delete selected text first
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        CGEventRef deleteDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)51, true); // Delete key
        CGEventRef deleteUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)51, false);
        
        CGEventPost(kCGHIDEventTap, deleteDown);
        CGEventPost(kCGHIDEventTap, deleteUp);
        
        CFRelease(deleteDown);
        CFRelease(deleteUp);
        CFRelease(source);
        
        // Insert new text
        return [self insertText:text];
    }
}

- (NSDictionary *)getActiveApplication {
    @autoreleasepool {
        NSRunningApplication *app = [[NSWorkspace sharedWorkspace] frontmostApplication];
        
        if (!app) {
            return @{};
        }
        
        return @{
            @"name": app.localizedName ?: @"",
            @"bundleId": app.bundleIdentifier ?: @"",
            @"pid": @(app.processIdentifier)
        };
    }
}

- (BOOL)isTextInputActive {
    @autoreleasepool {
        // Check if there's an active input source
        TISInputSourceRef currentSource = TISCopyCurrentKeyboardInputSource();
        if (!currentSource) {
            return NO;
        }
        
        CFRelease(currentSource);
        return YES;
    }
}

- (BOOL)sendKeyboardShortcut:(NSString *)key modifiers:(NSDictionary *)modifiers {
    @autoreleasepool {
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        
        // Build modifier flags
        CGEventFlags flags = 0;
        if ([modifiers[@"command"] boolValue]) flags |= kCGEventFlagMaskCommand;
        if ([modifiers[@"shift"] boolValue]) flags |= kCGEventFlagMaskShift;
        if ([modifiers[@"option"] boolValue]) flags |= kCGEventFlagMaskAlternate;
        if ([modifiers[@"control"] boolValue]) flags |= kCGEventFlagMaskControl;
        
        // Get key code (simplified - you'd want a full mapping)
        CGKeyCode keyCode = 0;
        if ([key length] > 0) {
            unichar character = [key characterAtIndex:0];
            // Simple mapping - extend this for full support
            keyCode = (CGKeyCode)character;
        }
        
        CGEventRef keyDown = CGEventCreateKeyboardEvent(source, keyCode, true);
        CGEventRef keyUp = CGEventCreateKeyboardEvent(source, keyCode, false);
        
        if (flags != 0) {
            CGEventSetFlags(keyDown, flags);
            CGEventSetFlags(keyUp, flags);
        }
        
        CGEventPost(kCGHIDEventTap, keyDown);
        CGEventPost(kCGHIDEventTap, keyUp);
        
        CFRelease(keyDown);
        CFRelease(keyUp);
        CFRelease(source);
        
        return YES;
    }
}

- (void)startMonitoring:(void (^)(NSDictionary *))callback {
    if (_isMonitoring) {
        return;
    }
    
    _isMonitoring = YES;
    _eventCallback = [callback copy];
    
    // Monitor keyboard events
    [NSEvent addGlobalMonitorForEventsMatchingMask:NSEventMaskKeyDown handler:^(NSEvent *event) {
        if (self.eventCallback) {
            NSDictionary *eventData = @{
                @"type": @"keyDown",
                @"characters": event.characters ?: @"",
                @"keyCode": @(event.keyCode),
                @"modifiers": @{
                    @"command": @((event.modifierFlags & NSEventModifierFlagCommand) != 0),
                    @"shift": @((event.modifierFlags & NSEventModifierFlagShift) != 0),
                    @"option": @((event.modifierFlags & NSEventModifierFlagOption) != 0),
                    @"control": @((event.modifierFlags & NSEventModifierFlagControl) != 0)
                }
            };
            self.eventCallback(eventData);
        }
    }];
}

- (void)stopMonitoring {
    _isMonitoring = NO;
    _eventCallback = nil;
    // Note: Can't easily remove global monitor without keeping reference
}

@end

// Global bridge instance
static InputMethodBridge *bridge = nil;

namespace InputMethodController {

void Init(Local<Object> exports) {
    // Initialize the bridge on first use
    if (!bridge) {
        bridge = [[InputMethodBridge alloc] init];
    }
}

Local<Value> InsertText(const char *text) {
    Nan::EscapableHandleScope scope;
    
    NSString *nsText = [NSString stringWithUTF8String:text];
    BOOL success = [bridge insertText:nsText];
    
    return scope.Escape(Nan::New(success));
}

void InsertTextWithTyping(const char *text, int delayMs, Nan::Callback *callback) {
    NSString *nsText = [NSString stringWithUTF8String:text];
    NSTimeInterval delay = delayMs / 1000.0;
    
    [bridge insertTextWithTyping:nsText delay:delay completion:^(BOOL success) {
        Nan::HandleScope scope;
        Local<Value> argv[] = { Nan::New(success) };
        callback->Call(1, argv, nullptr);
    }];
}

Local<Value> GetSelectedText() {
    Nan::EscapableHandleScope scope;
    
    NSString *text = [bridge getSelectedText];
    return scope.Escape(Nan::New([text UTF8String]).ToLocalChecked());
}

Local<Value> ReplaceSelectedText(const char *text) {
    Nan::EscapableHandleScope scope;
    
    NSString *nsText = [NSString stringWithUTF8String:text];
    BOOL success = [bridge replaceSelectedText:nsText];
    
    return scope.Escape(Nan::New(success));
}

Local<Object> GetActiveApplication() {
    Nan::EscapableHandleScope scope;
    
    NSDictionary *appInfo = [bridge getActiveApplication];
    Local<Object> obj = Nan::New<Object>();
    
    NSString *name = appInfo[@"name"];
    NSString *bundleId = appInfo[@"bundleId"];
    NSNumber *pid = appInfo[@"pid"];
    
    if (name) {
        Nan::Set(obj, Nan::New("name").ToLocalChecked(), 
                 Nan::New([name UTF8String]).ToLocalChecked());
    }
    if (bundleId) {
        Nan::Set(obj, Nan::New("bundleId").ToLocalChecked(), 
                 Nan::New([bundleId UTF8String]).ToLocalChecked());
    }
    if (pid) {
        Nan::Set(obj, Nan::New("pid").ToLocalChecked(), 
                 Nan::New([pid intValue]));
    }
    
    return scope.Escape(obj);
}

Local<Value> IsTextInputActive() {
    Nan::EscapableHandleScope scope;
    BOOL isActive = [bridge isTextInputActive];
    return scope.Escape(Nan::New(isActive));
}

} // namespace InputMethodController
