import { Explanation } from '@/components/explaination'

interface ExplanationSectionProps {
  explanation: string | undefined
  explanationPosition: { x: number; y: number } | undefined
  isDarkTheme: boolean
  onClose: () => void
}

export const ExplanationSection = ({
  explanation,
  explanationPosition,
  isDarkTheme,
  onClose
}: ExplanationSectionProps) => {
  if (!explanation) return null

  return (
    <Explanation
      explanation={explanation}
      isDarkTheme={isDarkTheme}
      position={explanationPosition}
      onClose={onClose}
    />
  )
}
