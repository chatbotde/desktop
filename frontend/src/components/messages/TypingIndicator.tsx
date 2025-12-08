export function TypingIndicator() {
  return (
    <div className="flex justify-start message-appear">
      <div className="bg-transparent text-white px-4 py-2 max-w-[90%] md:max-w-[85%] lg:max-w-[75%]">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/70 mr-2">AI is thinking</span>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}
