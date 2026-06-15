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
import { ExpandedGroundingButton } from "../expanded-grounding-button"
import { ExpandedSubmitButton } from "../expanded-submit-button"
import { ReferenceButton } from "./reference-button"
import { actionButtonRegistry } from "../registry/action-button-registry"
import type { ExpandedActionsBarContext } from "../types/expanded-actions-context"
import { getAvailableModels, isModelWorking } from "@/lib/ai/model-config"

export function registerDefaultActions(context: ExpandedActionsBarContext | (() => ExpandedActionsBarContext)) {
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

  // Media Upload Button (Left side, order: 0) - dropdown appears above input
  actionButtonRegistry.register({
    id: "media-upload",
    order: 0,
    component: (
      <PromptInputAction tooltip="Add action" key="media-upload">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Add action"
              className={hoverClass + " flex h-8 w-8 items-center justify-center rounded-full transition-colors"}
            >
              <Plus className={`size-5 ${themeClasses.icon}`} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-none bg-transparent shadow-none"
            side="top"
            align="start"
            sideOffset={16}
            style={{ zIndex: 9999 }}
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

  // Model Selector Button (Left side, order: 1) - dropdown appears above
  actionButtonRegistry.register({
    id: "model-selector",
    order: 1,
    condition: () => {
      const workingCloudModels = getAvailableModels().some(isModelWorking)
      const ctx = getContext()
      const hasLocalModels = !!(ctx.ollamaRunning && ctx.ollamaModels && ctx.ollamaModels.length > 0)
      return !!(workingCloudModels || hasLocalModels)
    },
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

  // Add in reference (Left side, order: 3)
  actionButtonRegistry.register({
    id: "add-reference",
    order: 3,
    condition: () => !!getContext().onReferenceAdd,
    component: () => {
      const ctx = getContext()
      if (!ctx.onReferenceAdd) return null
      return (
        <ReferenceButton
          key="add-reference"
          isDarkTheme={ctx.isDarkTheme}
          themeClasses={ctx.themeClasses}
          hoverClass={ctx.hoverClass}
          selectedReferences={ctx.references ?? []}
          onReferenceAdd={ctx.onReferenceAdd}
        />
      )
    },
  })

  // Grounding Button (Left side, order: 2, conditional)
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
    component: () => {
      return (
        <PromptInputAction tooltip="Voice input" key="voice-input">
          <MicHoverAudioPill
            isDarkTheme={isDarkTheme}
            className="h-8 w-8"
          />
        </PromptInputAction>
      )
    },
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
        />
      )
    },
  })
}
