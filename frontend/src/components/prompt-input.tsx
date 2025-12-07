import { useRef, useState } from "react"
import { PromptInputCollapsed } from "./prompt-input-collapsed"
import { PromptInputExpanded } from "./prompt-input-expanded"

interface PromptInputWithActionsProps {
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function PromptInputWithActions({ 
  isVisible: controlledVisible, 
  onVisibilityChange 
}: PromptInputWithActionsProps = {}) {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setInput("")
        setFiles([])
        setIsExpanded(false)
      }, 2000)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setFiles((prev) => [...prev, ...newFiles])
      setIsExpanded(true)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (uploadInputRef?.current) {
      uploadInputRef.current.value = ""
    }
  }

  // Use controlled or internal visibility
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible
  const setIsVisible = (visible: boolean) => {
    if (onVisibilityChange) {
      onVisibilityChange(visible)
    } else {
      setInternalVisible(visible)
    }
  }

  // Hidden state - return null (RightTransparent will show the input)
  if (!isVisible) {
    return null
  }

  // Collapsed state - functional input bar
  if (!isExpanded) {
    return (
      <PromptInputCollapsed
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        files={files}
        onSubmit={handleSubmit}
        onExpand={() => setIsExpanded(true)}
        onHide={() => setIsVisible(false)}
      />
    )
  }

  // Expanded state - full input with actions
  return (
    <PromptInputExpanded
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      files={files}
      onSubmit={handleSubmit}
      onCollapse={() => setIsExpanded(false)}
      onHide={() => setIsVisible(false)}
      onFileChange={handleFileChange}
      onRemoveFile={handleRemoveFile}
    />
  )
}

