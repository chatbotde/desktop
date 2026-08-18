import { useState } from 'react'
import { Shirt, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GLOBAL_THEME } from '@/global/theme'
import { useIsDark } from '@/shared/providers'
import type { TryOnCategory } from '@/lib/image/virtual-tryon'

type SlotRole = 'person' | 'garment' | null

interface VirtualTryOnPanelProps {
  imagePreviewUrls: string[]
  files: File[]
  isGenerating: boolean
  onTryOn: (personIndex: number, garmentIndex: number, category: TryOnCategory) => void
  onBack: () => void
}

function RoleSlot({
  label,
  icon: Icon,
  src,
  isActive,
  isDark,
  onClick,
}: {
  label: string
  icon: typeof User
  src: string | null
  isActive: boolean
  isDark: boolean
  onClick: () => void
}) {
  const colors = GLOBAL_THEME.vars

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all min-w-0 flex-1',
        isActive
          ? isDark
            ? 'border-blue-500 bg-blue-950 ring-1 ring-blue-500'
            : 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
          : isDark
            ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
            : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
      )}
    >
      <div
        className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide"
        style={{ color: colors.textMuted }}
      >
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div
        className={cn(
          'w-full aspect-[3/4] rounded overflow-hidden border',
          isDark ? 'border-zinc-700 bg-zinc-950' : 'border-zinc-200 bg-white'
        )}
      >
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xs"
            style={{ color: colors.textMuted }}
          >
            Tap image
          </div>
        )}
      </div>
    </button>
  )
}

export function VirtualTryOnPanel({
  imagePreviewUrls,
  files,
  isGenerating,
  onTryOn,
  onBack,
}: VirtualTryOnPanelProps) {
  const isDark = useIsDark()
  const colors = GLOBAL_THEME.vars

  const [personIndex, setPersonIndex] = useState(files.length >= 1 ? 0 : -1)
  const [garmentIndex, setGarmentIndex] = useState(files.length >= 2 ? 1 : -1)
  const [activeSlot, setActiveSlot] = useState<SlotRole>('person')
  const [category, setCategory] = useState<TryOnCategory>('auto')

  const handleThumbnailClick = (index: number) => {
    if (activeSlot === 'person') {
      setPersonIndex(index)
      if (garmentIndex === index) setGarmentIndex(-1)
      setActiveSlot('garment')
      return
    }
    if (activeSlot === 'garment') {
      if (index === personIndex) return
      setGarmentIndex(index)
      setActiveSlot(null)
    }
  }

  const canTryOn =
    personIndex >= 0 &&
    garmentIndex >= 0 &&
    personIndex !== garmentIndex &&
    !isGenerating

  return (
    <div
      className="flex flex-col w-[320px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-32px)] overflow-y-auto p-3 gap-3"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shirt className="w-4 h-4" style={{ color: colors.accent }} />
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            Virtual Try-On
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'text-xs px-2 py-1 rounded-md transition-colors border',
            isDark
              ? 'text-zinc-300 border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:text-white'
              : 'text-zinc-600 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900'
          )}
        >
          Ask AI
        </button>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
        Select a person screenshot and a clothing screenshot, then try on.
      </p>

      <div className="flex gap-2">
        <RoleSlot
          label="Person"
          icon={User}
          src={personIndex >= 0 ? imagePreviewUrls[personIndex] : null}
          isActive={activeSlot === 'person'}
          isDark={isDark}
          onClick={() => setActiveSlot('person')}
        />
        <RoleSlot
          label="Garment"
          icon={Shirt}
          src={garmentIndex >= 0 ? imagePreviewUrls[garmentIndex] : null}
          isActive={activeSlot === 'garment'}
          isDark={isDark}
          onClick={() => setActiveSlot('garment')}
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {imagePreviewUrls.map((url, index) => {
          const isPerson = index === personIndex
          const isGarment = index === garmentIndex
          const isSelected = isPerson || isGarment

          return (
            <button
              key={`${files[index]?.name ?? 'shot'}-${index}`}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={cn(
                'relative w-12 h-12 rounded-md overflow-hidden border-2 transition-all shrink-0',
                isSelected
                  ? isPerson
                    ? 'border-blue-500'
                    : 'border-emerald-500'
                  : isDark
                    ? 'border-zinc-700 hover:border-zinc-500'
                    : 'border-zinc-200 hover:border-zinc-400',
                activeSlot && !isSelected && (isDark ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400')
              )}
              title={
                isPerson ? 'Person' : isGarment ? 'Garment' : `Assign to ${activeSlot ?? 'slot'}`
              }
            >
              <img src={url} alt={`Capture ${index + 1}`} className="w-full h-full object-cover" />
              {isPerson && (
                <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] text-white text-center py-0.5 font-medium">
                  Person
                </span>
              )}
              {isGarment && (
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] text-white text-center py-0.5 font-medium">
                  Cloth
                </span>
              )}
            </button>
          )
        })}
      </div>

      <label className="flex flex-col gap-1">
        <span
          className="text-[10px] uppercase tracking-wide font-medium"
          style={{ color: colors.textMuted }}
        >
          Garment type
        </span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as TryOnCategory)}
          className={cn(
            'text-xs rounded-md border px-2 py-1.5 outline-none',
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
              : 'bg-white border-zinc-200 text-zinc-900'
          )}
        >
          <option value="auto">Auto detect</option>
          <option value="tops">Tops</option>
          <option value="bottoms">Bottoms</option>
          <option value="one-pieces">Dresses / one-pieces</option>
        </select>
      </label>

      <button
        type="button"
        disabled={!canTryOn}
        onClick={() => onTryOn(personIndex, garmentIndex, category)}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
          canTryOn
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
            : isDark
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              : 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Trying on...
          </>
        ) : (
          <>
            <Shirt className="w-4 h-4" />
            Try On
          </>
        )}
      </button>
    </div>
  )
}
