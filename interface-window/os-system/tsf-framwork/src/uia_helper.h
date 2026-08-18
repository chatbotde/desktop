#pragma once

#include <windows.h>
#include <UIAutomation.h>
#include <oleacc.h>
#include <string>
#include <vector>

/** Serializable UIA target captured at pin assign time. */
struct UiaTargetSnapshot {
    std::vector<int> runtimeId;
    std::wstring automationId;
    std::wstring name;
    std::wstring className;
    int controlType = 0;
    int anchorX = 0;
    int anchorY = 0;
    std::wstring nativeHwnd;
    bool supportsValue = false;
    bool supportsText = false;
};

class UiaHelper {
public:
    UiaHelper();
    ~UiaHelper();

    bool IsAvailable();

    /** Capture editable/accessibility target at screen point (physical px). */
    bool CaptureAtPoint(int x, int y, UiaTargetSnapshot* out);

    /** Insert text via UIA without raising the target window (best effort). */
    bool InsertText(const UiaTargetSnapshot& target, const std::wstring& text);

private:
    IUIAutomation* m_automation = nullptr;
    bool m_comInitialized = false;

    bool EnsureAutomation();
    void ReleaseAutomation();
    bool ReadRuntimeId(IUIAutomationElement* element, std::vector<int>* out);
    bool RuntimeIdsEqual(const std::vector<int>& a, IUIAutomationElement* element);
    IUIAutomationElement* FindEditableAtPoint(int x, int y);
    IUIAutomationElement* ResolveTargetElement(const UiaTargetSnapshot& target);
    bool TryAccessibleSetValueAtPoint(int x, int y, const std::wstring& text);
    std::wstring ReadBstrProperty(IUIAutomationElement* element, PROPERTYID propId);
};
