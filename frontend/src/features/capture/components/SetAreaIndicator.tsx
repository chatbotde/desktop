import { useSyncExternalStore, useState, useRef, useCallback } from 'react'
import { CaptureAreaStore } from '../capture-area-store'

const BORDER_WIDTH = 5
const CORNER_RADIUS = 0
const SEGMENT_LENGTH = 40 // Fixed length for each segment (both segments equal)

export function SetAreaIndicator() {
    const [area, setArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; corner: string } | null>(null)
    const areaRef = useRef(area)
    
    // Keep ref in sync with state - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            areaRef.current = area
            return () => {}
        }, [area]),
        () => null,
        () => null
    )

    // Subscribe to CaptureAreaStore - using syncExternalStore
    useSyncExternalStore(
        useCallback((callback) => {
            const initialArea = CaptureAreaStore.getArea()
            setArea(initialArea)

            const unsubscribe = CaptureAreaStore.subscribe((newArea) => {
                setArea(newArea)
            })

            return () => {
                unsubscribe()
            }
        }, []),
        () => null,
        () => null
    )

    const handleMouseDown = (e: React.MouseEvent, corner: string) => {
        e.preventDefault()
        e.stopPropagation()
        if (!area) return

        // Disable clickthrough when resizing
        const api = window.interfaceAPI
        const setIgnore = api?.setIgnoreMouseEvents
        if (setIgnore) {
            setIgnore(false)
        }

        const startArea = { ...area }
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: startArea.width,
            height: startArea.height,
            corner,
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeStartRef.current) return

            const deltaX = e.clientX - resizeStartRef.current.x
            const deltaY = e.clientY - resizeStartRef.current.y

            let newArea = { ...startArea }

            switch (corner) {
                case 'nw': // Top-left
                    newArea.x = startArea.x + deltaX
                    newArea.y = startArea.y + deltaY
                    newArea.width = startArea.width - deltaX
                    newArea.height = startArea.height - deltaY
                    break
                case 'ne': // Top-right
                    newArea.y = startArea.y + deltaY
                    newArea.width = startArea.width + deltaX
                    newArea.height = startArea.height - deltaY
                    break
                case 'sw': // Bottom-left
                    newArea.x = startArea.x + deltaX
                    newArea.width = startArea.width - deltaX
                    newArea.height = startArea.height + deltaY
                    break
                case 'se': // Bottom-right
                    newArea.width = startArea.width + deltaX
                    newArea.height = startArea.height + deltaY
                    break
            }

            // Minimum size constraint
            if (newArea.width < 50) {
                if (corner === 'nw' || corner === 'sw') {
                    newArea.x = startArea.x + startArea.width - 50
                }
                newArea.width = 50
            }
            if (newArea.height < 50) {
                if (corner === 'nw' || corner === 'ne') {
                    newArea.y = startArea.y + startArea.height - 50
                }
                newArea.height = 50
            }

            setArea(newArea)
        }

        const handleMouseUp = () => {
            // Re-enable clickthrough after resizing
            const api = window.interfaceAPI
            const setIgnore = api?.setIgnoreMouseEvents
            if (setIgnore) {
                setIgnore(true, { forward: true })
            }

            // Use ref to get the latest area value
            const currentArea = areaRef.current
            if (currentArea) {
                CaptureAreaStore.setArea(currentArea)
            }
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    if (!area) return null

    // Calculate border segments - two per side, one from each corner with 80% gap in between
    const renderBorderSegments = () => {
        const segments = []
        const availableWidth = area.width - (CORNER_RADIUS * 2)
        const availableHeight = area.height - (CORNER_RADIUS * 2)
        
        // Use fixed segment length for both segments (equal length)
        const topBottomSegmentLength = Math.min(SEGMENT_LENGTH, availableWidth / 2)
        const leftRightSegmentLength = Math.min(SEGMENT_LENGTH, availableHeight / 2)

        // Top border - two segments with 80% gap in middle
        if (topBottomSegmentLength > 0 && availableWidth > 0) {
            // Left segment (from left corner)
            segments.push(
                <div
                    key="top-left"
                    className="absolute bg-blue-500"
                    style={{
                        left: `${CORNER_RADIUS}px`,
                        top: 0,
                        width: `${topBottomSegmentLength}px`,
                        height: `${BORDER_WIDTH}px`,
                    }}
                />
            )
            // Right segment (from right corner)
            segments.push(
                <div
                    key="top-right"
                    className="absolute bg-blue-500"
                    style={{
                        right: `${CORNER_RADIUS}px`,
                        top: 0,
                        width: `${topBottomSegmentLength}px`,
                        height: `${BORDER_WIDTH}px`,
                    }}
                />
            )
        }

        // Right border - two segments with 80% gap in middle
        if (leftRightSegmentLength > 0 && availableHeight > 0) {
            // Top segment (from top corner)
            segments.push(
                <div
                    key="right-top"
                    className="absolute bg-blue-500"
                    style={{
                        right: 0,
                        top: `${CORNER_RADIUS}px`,
                        width: `${BORDER_WIDTH}px`,
                        height: `${leftRightSegmentLength}px`,
                    }}
                />
            )
            // Bottom segment (from bottom corner)
            segments.push(
                <div
                    key="right-bottom"
                    className="absolute bg-blue-500"
                    style={{
                        right: 0,
                        bottom: `${CORNER_RADIUS}px`,
                        width: `${BORDER_WIDTH}px`,
                        height: `${leftRightSegmentLength}px`,
                    }}
                />
            )
        }

        // Bottom border - two segments with 80% gap in middle
        if (topBottomSegmentLength > 0 && availableWidth > 0) {
            // Left segment (from left corner)
            segments.push(
                <div
                    key="bottom-left"
                    className="absolute bg-blue-500"
                    style={{
                        left: `${CORNER_RADIUS}px`,
                        bottom: 0,
                        width: `${topBottomSegmentLength}px`,
                        height: `${BORDER_WIDTH}px`,
                    }}
                />
            )
            // Right segment (from right corner)
            segments.push(
                <div
                    key="bottom-right"
                    className="absolute bg-blue-500"
                    style={{
                        right: `${CORNER_RADIUS}px`,
                        bottom: 0,
                        width: `${topBottomSegmentLength}px`,
                        height: `${BORDER_WIDTH}px`,
                    }}
                />
            )
        }

        // Left border - two segments with 80% gap in middle
        if (leftRightSegmentLength > 0 && availableHeight > 0) {
            // Top segment (from top corner)
            segments.push(
                <div
                    key="left-top"
                    className="absolute bg-blue-500"
                    style={{
                        left: 0,
                        top: `${CORNER_RADIUS}px`,
                        width: `${BORDER_WIDTH}px`,
                        height: `${leftRightSegmentLength}px`,
                    }}
                />
            )
            // Bottom segment (from bottom corner)
            segments.push(
                <div
                    key="left-bottom"
                    className="absolute bg-blue-500"
                    style={{
                        left: 0,
                        bottom: `${CORNER_RADIUS}px`,
                        width: `${BORDER_WIDTH}px`,
                        height: `${leftRightSegmentLength}px`,
                    }}
                />
            )
        }

        return segments
    }

    return (
        <div
            className="fixed z-[999998] pointer-events-none"
            style={{
                left: `${area.x}px`,
                top: `${area.y}px`,
                width: `${area.width}px`,
                height: `${area.height}px`,
            }}
        >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-blue-transparent rounded-lg pointer-events-none" />

            {/* Segmented border */}
            {renderBorderSegments()}

            {/* Invisible resize handles - no visual corner arcs */}
            <div
                className="absolute -top-2 -left-2 w-8 h-8 pointer-events-auto cursor-nwse-resize"
                data-no-clickthrough
                style={{ zIndex: 1 }}
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
                className="absolute -top-2 -right-2 w-8 h-8 pointer-events-auto cursor-nesw-resize"
                data-no-clickthrough
                style={{ zIndex: 1 }}
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
                className="absolute -bottom-2 -left-2 w-8 h-8 pointer-events-auto cursor-nesw-resize"
                data-no-clickthrough
                style={{ zIndex: 1 }}
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
                className="absolute -bottom-2 -right-2 w-8 h-8 pointer-events-auto cursor-nwse-resize"
                data-no-clickthrough
                style={{ zIndex: 1 }}
                onMouseDown={(e) => handleMouseDown(e, 'se')}
            />
        </div>
    );
}