#import <Cocoa/Cocoa.h>
#import <Carbon/Carbon.h>
#include "text_inserter.h"

@implementation TextInserter

+ (BOOL)insertTextAtCursor:(NSString *)text {
    @autoreleasepool {
        // Get accessibility element at current cursor
        AXUIElementRef systemWide = AXUIElementCreateSystemWide();
        AXUIElementRef focusedElement = NULL;
        
        AXError error = AXUIElementCopyAttributeValue(
            systemWide, 
            kAXFocusedUIElementAttribute, 
            (CFTypeRef *)&focusedElement
        );
        
        if (error != kAXErrorSuccess || !focusedElement) {
            CFRelease(systemWide);
            return NO;
        }
        
        // Try to set the value directly via accessibility
        CFStringRef textRef = (__bridge CFStringRef)text;
        error = AXUIElementSetAttributeValue(
            focusedElement,
            kAXSelectedTextAttribute,
            textRef
        );
        
        BOOL success = (error == kAXErrorSuccess);
        
        CFRelease(focusedElement);
        CFRelease(systemWide);
        
        return success;
    }
}

+ (BOOL)insertTextViaKeyEvents:(NSString *)text {
    @autoreleasepool {
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        
        for (NSUInteger i = 0; i < [text length]; i++) {
            unichar character = [text characterAtIndex:i];
            
            CGEventRef keyDown = CGEventCreateKeyboardEvent(source, 0, true);
            CGEventRef keyUp = CGEventCreateKeyboardEvent(source, 0, false);
            
            CGEventKeyboardSetUnicodeString(keyDown, 1, &character);
            CGEventKeyboardSetUnicodeString(keyUp, 1, &character);
            
            CGEventPost(kCGHIDEventTap, keyDown);
            CGEventPost(kCGHIDEventTap, keyUp);
            
            CFRelease(keyDown);
            CFRelease(keyUp);
        }
        
        CFRelease(source);
        return YES;
    }
}

+ (BOOL)pasteText:(NSString *)text {
    @autoreleasepool {
        // Save current clipboard
        NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
        NSArray *previousTypes = [pasteboard types];
        NSMutableDictionary *previousContent = [NSMutableDictionary dictionary];
        
        for (NSString *type in previousTypes) {
            id content = [pasteboard dataForType:type];
            if (content) {
                previousContent[type] = content;
            }
        }
        
        // Set new content
        [pasteboard clearContents];
        [pasteboard setString:text forType:NSPasteboardTypeString];
        
        // Simulate Cmd+V
        CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
        CGEventRef cmdVDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, true); // V key
        CGEventRef cmdVUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, false);
        
        CGEventSetFlags(cmdVDown, kCGEventFlagMaskCommand);
        CGEventSetFlags(cmdVUp, kCGEventFlagMaskCommand);
        
        CGEventPost(kCGHIDEventTap, cmdVDown);
        CGEventPost(kCGHIDEventTap, cmdVUp);
        
        CFRelease(cmdVDown);
        CFRelease(cmdVUp);
        CFRelease(source);
        
        // Wait for paste to complete
        [NSThread sleepForTimeInterval:0.05];
        
        // Restore previous clipboard
        [pasteboard clearContents];
        for (NSString *type in previousContent) {
            [pasteboard setData:previousContent[type] forType:type];
        }
        
        return YES;
    }
}

+ (CGPoint)getCursorPosition {
    @autoreleasepool {
        AXUIElementRef systemWide = AXUIElementCreateSystemWide();
        AXUIElementRef focusedElement = NULL;
        
        AXError error = AXUIElementCopyAttributeValue(
            systemWide,
            kAXFocusedUIElementAttribute,
            (CFTypeRef *)&focusedElement
        );
        
        CGPoint position = CGPointMake(-1, -1);
        
        if (error == kAXErrorSuccess && focusedElement) {
            CFTypeRef positionValue = NULL;
            error = AXUIElementCopyAttributeValue(
                focusedElement,
                kAXPositionAttribute,
                &positionValue
            );
            
            if (error == kAXErrorSuccess && positionValue) {
                AXValueGetValue((AXValueRef)positionValue, kAXValueCGPointType, &position);
                CFRelease(positionValue);
            }
            
            CFRelease(focusedElement);
        }
        
        CFRelease(systemWide);
        return position;
    }
}

+ (BOOL)checkAccessibilityPermissions {
    NSDictionary *options = @{(__bridge id)kAXTrustedCheckOptionPrompt: @YES};
    return AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)options);
}

@end
