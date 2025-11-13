import { AlertCircle, CheckCircle } from 'lucide-react'
import { 
  isGeminiConfigured, 
  isOpenAIConfigured, 
  isAnthropicConfigured,
  unifiedAIService
} from '@/lib/ai'

export function WelcomeScreen() {
  const providerStatus = unifiedAIService.getCurrentProviderStatus()
  
  const providers = [
    { name: 'Google Gemini', isConfigured: isGeminiConfigured(), icon: '🤖' },
    { name: 'OpenAI', isConfigured: isOpenAIConfigured(), icon: '🔮' },
    { name: 'Anthropic Claude', isConfigured: isAnthropicConfigured(), icon: '🧠' },
  ]

  return (
    <div className="min-h-full flex items-start justify-center py-8">
      <div className="text-center space-y-8 max-w-2xl mx-auto p-8 w-full">
        <div className="space-y-4">
          <div className="relative flex items-center justify-center text-6xl text-white/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
            >
              {/* Black & white minimalist rocket launch sketch */}
              {/* Rocket body */}
              <path
                d="M32 10C28 16 27 38 32 52C37 38 36 16 32 10Z"
                stroke="white"
                strokeWidth="2"
                fill="transparent"
              />
              {/* Window */}
              <circle
                cx="32"
                cy="25"
                r="4"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Left fin */}
              <path
                d="M28 45L20 53L31 49"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Right fin */}
              <path
                d="M36 45L44 53L33 49"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Flame */}
              <path
                d="M30 55 Q32 62 34 55 Q32 59 30 55Z"
                stroke="white"
                strokeWidth="1.3"
                fill="none"
              />
              {/* Simple launch smoke/sketch lines below */}
              <path
                d="M26 61 Q28 62 32 61 Q36 60 38 61"
                stroke="#fff"
                strokeWidth="0.9"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M29 64 Q32 63 35 64"
                stroke="#fff"
                strokeWidth="0.8"
                fill="none"
                opacity="0.4"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white/90">Buddy</h1>
          
          
          {/* Current Provider Status */}
          <div className={`p-4 rounded-lg border ${
            providerStatus.isConfigured 
              ? 'bg-green-500/10 border-green-400/30'
              : 'bg-orange-500/10 border-orange-400/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-5 h-5 ${
                providerStatus.isConfigured 
                  ? 'text-green-400' 
                  : 'text-orange-400'
              }`} />
              <span className={`text-sm font-medium ${
                providerStatus.isConfigured 
                  ? 'text-green-400' 
                  : 'text-orange-400'
              }`}>
                Current Model: {providerStatus.model || 'None Selected'}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {providerStatus.message}
            </p>
          </div>

          {/* All Providers Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-white/70 text-left">Available Providers</h3>
            <div className="grid grid-cols-2 gap-2">
              {providers.map((provider) => (
                <div 
                  key={provider.name}
                  className={`p-3 rounded-lg border text-left ${
                    provider.isConfigured
                      ? 'bg-green-500/5 border-green-400/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {provider.isConfigured ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-white/30" />
                    )}
                    <span className="text-xs font-medium text-white/80">
                      {provider.icon} {provider.name}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {provider.isConfigured ? 'Ready' : 'Not configured'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          
          
        </div>
      </div>
    </div>
  )
}
