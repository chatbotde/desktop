export function TypingIndicator() {
  return (
    <div className="flex justify-start message-appear">
      <div className="bg-transparent text-white px-4 py-2 max-w-[90%] md:max-w-[85%] lg:max-w-[75%]">
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{ 
                animation: 'thinking 1.4s ease-in-out infinite',
                animationDelay: '0ms'
              }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{ 
                animation: 'thinking 1.4s ease-in-out infinite',
                animationDelay: '200ms'
              }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-blue-400"
              style={{ 
                animation: 'thinking 1.4s ease-in-out infinite',
                animationDelay: '400ms'
              }} 
            />
          </div>
          <span className="text-sm text-white/70">Thinking...</span>
        </div>
      </div>
      <style>{`
        @keyframes thinking {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          30% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
