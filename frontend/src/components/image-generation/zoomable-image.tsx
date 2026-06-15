"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { ZoomableImageProps } from "./types"

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_FACTOR = 1.1

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getFitSize(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number
) {
  if (!imageW || !imageH) {
    return { width: containerW, height: containerH }
  }

  const ratio = Math.min(containerW / imageW, containerH / imageH)
  return {
    width: imageW * ratio,
    height: imageH * ratio,
  }
}

function clampOffset(
  offset: { x: number; y: number },
  scale: number,
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number
) {
  if (scale <= 1) return { x: 0, y: 0 }

  const fit = getFitSize(containerW, containerH, imageW, imageH)
  const maxX = Math.max(0, (fit.width * scale - containerW) / 2)
  const maxY = Math.max(0, (fit.height * scale - containerH) / 2)

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  }
}

export function ZoomableImage({
  src,
  alt,
  isActive,
  fitSignal = 0,
  onError,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const panRef = useRef<{
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)

  const getContainerSize = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    return {
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
    }
  }, [])

  const applyOffset = useCallback(
    (nextOffset: { x: number; y: number }, nextScale: number) => {
      const { width, height } = getContainerSize()
      return clampOffset(nextOffset, nextScale, width, height, imageSize.width, imageSize.height)
    },
    [getContainerSize, imageSize.height, imageSize.width]
  )

  const resetZoom = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
    panRef.current = null
  }, [])

  useEffect(() => {
    resetZoom()
  }, [src, isActive, resetZoom])

  useEffect(() => {
    if (isActive) resetZoom()
  }, [fitSignal, isActive, resetZoom])

  useEffect(() => {
    if (scale <= 1) return
    setOffset((prev) => applyOffset(prev, scale))
  }, [applyOffset, imageSize.height, imageSize.width, scale])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !isActive) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const cx = rect.width / 2
      const cy = rect.height / 2
      const zoomFactor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR

      setScale((prevScale) => {
        const nextScale = clamp(prevScale * zoomFactor, MIN_ZOOM, MAX_ZOOM)
        if (nextScale === prevScale) return prevScale

        if (nextScale <= 1) {
          setOffset({ x: 0, y: 0 })
          return nextScale
        }

        const ratio = nextScale / prevScale
        setOffset((prevOffset) =>
          applyOffset(
            {
              x: (mx - cx) - ((mx - cx) - prevOffset.x) * ratio,
              y: (my - cy) - ((my - cy) - prevOffset.y) * ratio,
            },
            nextScale
          )
        )

        return nextScale
      })
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [applyOffset, isActive])

  useEffect(() => {
    if (!isActive || scale <= 1) return

    const onMouseMove = (e: MouseEvent) => {
      if (!panRef.current) return
      setOffset(
        applyOffset(
          {
            x: panRef.current.offsetX + (e.clientX - panRef.current.startX),
            y: panRef.current.offsetY + (e.clientY - panRef.current.startY),
          },
          scale
        )
      )
    }

    const onMouseUp = () => {
      panRef.current = null
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [applyOffset, isActive, scale])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    e.stopPropagation()
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resetZoom()
  }

  const isZoomed = scale > 1

  return (
    <div
      ref={containerRef}
      data-no-clickthrough
      className={cn(
        "relative h-full w-full overflow-hidden",
        isZoomed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={handleImageLoad}
        onError={onError}
        className="pointer-events-none absolute left-1/2 top-1/2 max-h-full max-w-full select-none"
        style={{
          transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </div>
  )
}
