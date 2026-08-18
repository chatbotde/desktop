import { cn } from "@/shared/lib/utils"
import { Slider } from "@/shared/components/ui/slider"

interface OpacityControlProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  id?: string
}

export function OpacityControl({
  value,
  onChange,
  min,
  max,
  step = 1,
  id = "surface-opacity",
}: OpacityControlProps) {
  const fillPercent = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      {/* The beautiful glowing slider */}
      <div className="relative flex h-10 items-center">
        {/* Glowing Background Track */}
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 overflow-hidden rounded-full border border-white/10 bg-black/30 dark:bg-white/5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]"
          aria-hidden
        >
          {/* Liquid Gradient Fill */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-primary transition-[width] duration-150 shadow-[0_0_12px_rgba(236,72,153,0.6)]"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([next]) => onChange(next)}
          aria-label="Surface opacity"
          className={cn(
            "relative z-10 w-full cursor-pointer",
            "[&_[data-slot=slider-track]]:h-3.5 [&_[data-slot=slider-track]]:bg-transparent",
            "[&_[data-slot=slider-range]]:bg-transparent",
            "[&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border [&_[data-slot=slider-thumb]]:border-black/20 [&_[data-slot=slider-thumb]]:shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,1)] [&_[data-slot=slider-thumb]]:rounded-full [&_[data-slot=slider-thumb]]:transition-transform [&_[data-slot=slider-thumb]]:active:scale-110 [&_[data-slot=slider-thumb]]:flex [&_[data-slot=slider-thumb]]:items-center [&_[data-slot=slider-thumb]]:justify-center [&_[data-slot=slider-thumb]]:after:content-[''] [&_[data-slot=slider-thumb]]:after:size-1.5 [&_[data-slot=slider-thumb]]:after:bg-primary [&_[data-slot=slider-thumb]]:after:rounded-full"
          )}
        />
      </div>
    </div>
  )
}
