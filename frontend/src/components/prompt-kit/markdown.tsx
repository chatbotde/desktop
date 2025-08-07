interface MarkdownProps {
  children: string
  className?: string
}

export function Markdown({ children, className }: MarkdownProps) {
  // Simple markdown renderer - you can enhance this with a proper markdown library
  return (
    <div className={className}>
      {children.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  )
}