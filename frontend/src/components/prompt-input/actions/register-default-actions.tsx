import { Plus } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { MediaUploadCard } from "../../media-upload-card"
import { PromptInputAction } from "@/components/prompt-kit/prompt-input"
import { ModelSelectorPopover } from "../../model-selector-popover"
import { MicHoverAudioPill } from "@/features/audio"
import { VideoHoverCapturePill } from "@/features/capture/components"
import { cn } from "@/lib/utils"
import { ExpandedGroundingButton } from "../expanded-grounding-button"
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
          ollamaRunning={ollamaRunning}
          ollamaModels={ollamaModels}
          selectedLocalModelName={selectedLocalModelName}
          onModelSelect={onModelSelect}
        />
      </PromptInputAction>
    ),
  })

  // Grounding Button (Left side, order: 2, conditional)
  // Use function component to read latest context values reactively
  actionButtonRegistry.register({
    id: "grounding",
    order: 2,
    condition: () => getContext().isGoogleModelSelected,
    component: () => {
      const ctx = getContext()
      return (
        <ExpandedGroundingButton
          key="grounding"
          groundingEnabled={ctx.groundingEnabled}
          onToggle={ctx.onToggleGrounding}
          isDarkTheme={ctx.isDarkTheme}
          themeClasses={ctx.themeClasses}
          hoverClass={ctx.hoverClass}
        />
      )
    },
  })

  // Voice Input Button (Right side, order: 10)
  actionButtonRegistry.register({
    id: "voice-input",
    order: 10,
    component: (
      <PromptInputAction tooltip="Voice input" key="voice-input">
        <MicHoverAudioPill
          isDarkTheme={isDarkTheme}
          className="h-8 w-8"
        />
      </PromptInputAction>
    ),
  })

  // Video/Capture Button (Right side, order: 10.5)
  actionButtonRegistry.register({
    id: "video-recording",
    order: 10.5,
    component: (
      <PromptInputAction tooltip="Capture options" key="video-recording">
        <VideoHoverCapturePill
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
          onHide={ctx.onHide}
          onToggleOutput={ctx.onToggleOutput}
          isOutputVisible={ctx.isOutputVisible}
          isDarkTheme={ctx.isDarkTheme}
          themeClasses={ctx.themeClasses}
          dragControls={ctx.dragControls}
        />
      )
    },
  })
}

