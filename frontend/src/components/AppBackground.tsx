interface AppBackgroundProps {
  currentTheme: 'transparent' | 'black'
}

export function AppBackground({ currentTheme }: AppBackgroundProps) {
  return (
    <>
      {currentTheme === 'transparent' ? (
        <>
          {/* Enhanced Glassmorphism Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-slate-800/10 to-slate-900/20 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]"></div>
        </>
      ) : (
        <>
          {/* Black Theme Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10"></div>
        </>
      )}
    </>
  )
}
