import { Rocket, AlertCircle } from 'lucide-react'
import { isGeminiConfigured, getGeminiConfigStatus } from '@/lib/ai/gemini-utils'

interface WelcomeScreenProps {
  currentTheme: 'transparent' | 'black'
}

export function WelcomeScreen({ currentTheme }: WelcomeScreenProps) {
  return (
    <div className="min-h-full flex items-start justify-center py-8">
      <div className="text-center space-y-8 max-w-md mx-auto p-8 w-full">
        <div className="space-y-4">
          <div className={`text-6xl ${currentTheme === 'black' ? 'text-white/20' : 'text-white/30'}`}>
            <Rocket className="w-16 h-16 mx-auto mb-4" />
          </div>
          
          
          
          {/* Gemini Configuration Status */}
          <div className={`p-3 rounded-lg border ${
            isGeminiConfigured() 
              ? `${currentTheme === 'black' ? 'bg-green-900/20 border-green-700' : 'bg-green-500/10 border-green-400/30'}`
              : `${currentTheme === 'black' ? 'bg-orange-900/20 border-orange-700' : 'bg-orange-500/10 border-orange-400/30'}`
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className={`w-4 h-4 ${
                isGeminiConfigured() 
                  ? 'text-green-400' 
                  : 'text-orange-400'
              }`} />
              <span className={`text-sm font-medium ${
                isGeminiConfigured() 
                  ? 'text-green-400' 
                  : 'text-orange-400'
              }`}>
                Gemini AI Status
              </span>
            </div>
            <p className={`text-xs ${currentTheme === 'black' ? 'text-gray-400' : 'text-white/60'}`}>
              {getGeminiConfigStatus().message}
            </p>
            {!isGeminiConfigured() && (
              <div className={`mt-2 text-xs ${currentTheme === 'black' ? 'text-gray-500' : 'text-white/50'} space-y-1`}>
                {getGeminiConfigStatus().instructions?.map((instruction, index) => (
                  <div key={index}>• {instruction}</div>
                ))}
              </div>
            )}
          </div>
          
         
          
         
        </div>
      </div>
    </div>
  )
}
