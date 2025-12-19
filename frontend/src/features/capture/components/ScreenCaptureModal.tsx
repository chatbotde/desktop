import { Button } from '@/shared/components/ui/button'
import { X, Camera } from 'lucide-react'

interface DesktopSource {
  id: string
  name: string
  thumbnail: string
}

interface ScreenCaptureModalProps {
  isVisible: boolean
  onClose: () => void
  isCapturing: boolean
  desktopSources: DesktopSource[]
  selectedSource: string | null
  onSourceSelect: (sourceId: string) => void
  onRefreshSources: () => void
  screenInfo: any
}

export function ScreenCaptureModal({
  isVisible,
  onClose,
  isCapturing,
  desktopSources,
  selectedSource,
  onSourceSelect,
  onRefreshSources,
  screenInfo
}: ScreenCaptureModalProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 rounded-xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/90 text-lg font-medium">Screen Capture</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/60 hover:text-white/90"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {isCapturing ? (
            <div className="text-center py-4">
              <div className="text-white/70">Loading available sources...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-white/70 text-sm">
                {screenInfo ? `Found ${screenInfo.displays.length} display(s)` : 'Getting screen info...'}
              </div>

              {desktopSources.length > 0 && (
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {desktopSources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSource === source.id
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                        }`}
                      onClick={() => onSourceSelect(source.id)}
                    >
                      <img
                        src={source.thumbnail}
                        alt={source.name}
                        className="w-full h-16 object-cover rounded mb-2"
                      />
                      <div className="text-white/80 text-xs truncate">
                        {source.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={onRefreshSources}
                  className="bg-purple-600/80 hover:bg-purple-700/80 text-white px-4 py-2 text-sm backdrop-blur-sm border border-purple-400/30"
                  size="sm"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Refresh Sources
                </Button>

                {selectedSource && (
                  <Button
                    onClick={() => console.log('Start capture with:', selectedSource)}
                    className="bg-green-600/80 hover:bg-green-700/80 text-white px-4 py-2 text-sm backdrop-blur-sm border border-green-400/30"
                    size="sm"
                  >
                    Start Capture
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
