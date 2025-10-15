import { Rocket, AlertCircle, CheckCircle } from 'lucide-react'
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
          <div className="text-6xl text-white/30">
            <Rocket className="w-16 h-16 mx-auto mb-4" />
          </div>
          
          <h1 className="text-2xl font-bold text-white/90">Welcome to Buddy</h1>
          <p className="text-sm text-white/60">Multi-provider AI chat assistant</p>
          
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

          {/* Setup Instructions */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/30 text-left">
            <h3 className="text-sm font-medium text-blue-400 mb-2">Setup Instructions</h3>
            <div className="text-xs text-white/60 space-y-1">
              <p>1. Create a <code className="bg-white/10 px-1 rounded">.env</code> file in the frontend folder</p>
              <p>2. Add API keys for the providers you want to use</p>
              <p>3. See <code className="bg-white/10 px-1 rounded">API_KEYS_SETUP.md</code> for detailed instructions</p>
              <p>4. Restart the development server</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
