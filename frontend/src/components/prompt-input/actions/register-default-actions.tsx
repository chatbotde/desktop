import { Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard } from "../../media-upload-card"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { ModelSelectorPopover } from "../../model-selector-popover"
import { LiveTranscriptionButton } from "@/features/audio"
import { VideoRecordingButton } from "@/features/capture/components"
import { cn } from "@/lib/utils"
import { ExpandedGroundingButton } from "../expanded-grounding-button"
import { ExpandedLocalModelPopover } from "../expanded-local-model-popover"
import { ExpandedSubmitButton } from "../expanded-submit-button"
import { actionButtonRegistry } from "../registry/action-button-registry"
import type { ExpandedActionsBarContext } from "../types/expanded-actions-context"

export function registerDefaultActions(context: ExpandedActionsBarContext | (() => ExpandedActionsBarContext)) {
  // Support both direct context and function that returns context (for reactive updates)
  const getContext = typeof context === 'function' ? context : () => context
  const currentContext = getContext()
  
  const {
    onFilesAdded,
    isDarkTheme,
    onMoreClick,
    onThemeChange,
    themeClasses,
    hoverClass,
    isLoading,
    canSubmit,
    onSubmit,
    onStop,
    isGoogleModelSelected,
    groundingEnabled,
    onToggleGrounding,
    showLocalControlInPrompt,
    ollamaRunning,
    ollamaModels,
    selectedLocalModelName,
    onModelSelect,
  } = currentContext

  // Media Upload Button (Left side, order: 0)
  actionButtonRegistry.register({
    id: "media-upload",
    order: 0,
    component: (
      <PromptInputAction tooltip="Add action" key="media-upload">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Add action"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                hoverClass
              )}
            >
              <Plus className={`size-5 ${themeClasses.icon}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-none bg-transparent shadow-none mb-2 z-[1002]"
            align="start"
          >
            <MediaUploadCard
              onFileUpload={onFilesAdded}
              isDarkTheme={isDarkTheme}
              onMoreClick={onMoreClick}
              onThemeChange={onThemeChange}
            />
          </PopoverContent>
        </Popover>
      </PromptInputAction>
    ),
  })

  // Model Selector Button (Left side, order: 1)
  actionButtonRegistry.register({
    id: "model-selector",
    order: 1,
    component: (
      <PromptInputAction tooltip="Select model" key="model-selector">
        <ModelSelectorPopover
          isDarkTheme={isDarkTheme}
          themeClasses={themeClasses}
        />
      </PromptInputAction>
    ),
  })

  // Grounding Button (Left side, order: 2, conditional)
  actionButtonRegistry.register({
    id: "grounding",
    order: 2,
    condition: () => isGoogleModelSelected,
    component: (
      <ExpandedGroundingButton
        key="grounding"
        groundingEnabled={groundingEnabled}
        onToggle={onToggleGrounding}
        isDarkTheme={isDarkTheme}
        themeClasses={themeClasses}
        hoverClass={hoverClass}
      />
    ),
  })

  // Local Model Button (Left side, order: 3, conditional)
  actionButtonRegistry.register({
    id: "local-model",
    order: 3,
    condition: () => showLocalControlInPrompt,
    component: (
      <ExpandedLocalModelPopover
        key="local-model"
        ollamaRunning={ollamaRunning}
        ollamaModels={ollamaModels}
        selectedLocalModelName={selectedLocalModelName}
        onModelSelect={onModelSelect}
        isDarkTheme={isDarkTheme}
        themeClasses={themeClasses}
        hoverClass={hoverClass}
      />
    ),
  })

  // Voice Input Button (Right side, order: 10)
  actionButtonRegistry.register({
    id: "voice-input",
    order: 10,
    component: (
      <PromptInputAction tooltip="Voice input" key="voice-input">
        <LiveTranscriptionButton
          isDarkTheme={isDarkTheme}
          className="h-8 w-8"
        />
      </PromptInputAction>
    ),
  })

  // Video Recording Button (Right side, order: 10.5)
  actionButtonRegistry.register({
    id: "video-recording",
    order: 10.5,
    component: (
      <PromptInputAction tooltip="Video recording" key="video-recording">
        <VideoRecordingButton
          isDarkTheme={isDarkTheme}
          className="h-8 w-8"
        />
      </PromptInputAction>
    ),
  })

  // Submit Button (Right side, order: 11)
  // Use function component to read latest context values reactively
  actionButtonRegistry.register({
    id: "submit",
    order: 11,
    component: () => {
      const ctx = getContext()
      return (
        <ExpandedSubmitButton
          key="submit"
          isLoading={ctx.isLoading}
          canSubmit={ctx.canSubmit}
          onSubmit={ctx.onSubmit}
          onStop={ctx.onStop}
        />
      )
    },
  })
}

