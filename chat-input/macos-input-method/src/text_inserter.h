#ifndef TEXT_INSERTER_H
#define TEXT_INSERTER_H

#import <Foundation/Foundation.h>
#import <ApplicationServices/ApplicationServices.h>

@interface TextInserter : NSObject

+ (BOOL)insertTextAtCursor:(NSString *)text;
+ (BOOL)insertTextViaKeyEvents:(NSString *)text;
+ (BOOL)pasteText:(NSString *)text;
+ (CGPoint)getCursorPosition;
+ (BOOL)checkAccessibilityPermissions;

@end

#endif // TEXT_INSERTER_H
