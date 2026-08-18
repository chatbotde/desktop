import { useSyncExternalStore, useCallback } from 'react'

const ALPHA_THRESHOLD = 0.08

function getColorAlpha(color: string): number {
	if (!color || color === 'transparent') return 0
	const rgba = color.match(/rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*([\d.]+)\s*)?\)/)
	if (rgba) return rgba[1] !== undefined ? parseFloat(rgba[1]) : 1
	if (color.startsWith('#') && color.length === 9) return parseInt(color.slice(7, 9), 16) / 255
	if (color.startsWith('#')) return 1
	return 0
}

function isVisuallyBlocking(el: HTMLElement): boolean {
	const style = window.getComputedStyle(el)
	if (style.pointerEvents === 'none') return false
	if (style.visibility === 'hidden' || style.display === 'none') return false

	const opacity = parseFloat(style.opacity)
	if (!Number.isFinite(opacity) || opacity < ALPHA_THRESHOLD) return false

	if (style.backdropFilter && style.backdropFilter !== 'none') return true

	const bgImage = style.backgroundImage
	if (bgImage && bgImage !== 'none') return true

	const bgAlpha = getColorAlpha(style.backgroundColor)
	if (bgAlpha > ALPHA_THRESHOLD) return true

	const borderAlpha = Math.max(
		getColorAlpha(style.borderTopColor),
		getColorAlpha(style.borderRightColor),
		getColorAlpha(style.borderBottomColor),
		getColorAlpha(style.borderLeftColor),
	)
	const borderWidth =
		parseFloat(style.borderTopWidth) +
		parseFloat(style.borderRightWidth) +
		parseFloat(style.borderBottomWidth) +
		parseFloat(style.borderLeftWidth)
	if (borderWidth > 0 && borderAlpha > ALPHA_THRESHOLD) return true

	if (style.boxShadow && style.boxShadow !== 'none') return true

	return false
}

function coversViewport(el: HTMLElement): boolean {
	const rect = el.getBoundingClientRect()
	const vw = window.innerWidth
	const vh = window.innerHeight
	return rect.width >= vw * 0.95 && rect.height >= vh * 0.95
}

/** Bounded panel with pointer-events-auto — standard overlay pattern, no attribute needed. */
function isPointerIsland(el: HTMLElement): boolean {
	const style = window.getComputedStyle(el)
	if (style.pointerEvents !== 'auto') return false
	if (style.visibility === 'hidden' || style.display === 'none') return false

	const opacity = parseFloat(style.opacity)
	if (!Number.isFinite(opacity) || opacity < ALPHA_THRESHOLD) return false

	const rect = el.getBoundingClientRect()
	if (rect.width < 2 || rect.height < 2) return false
	if (coversViewport(el)) return false

	return true
}

/** Full-screen selection/drawing overlays (crosshair cursor). */
function isFullScreenCaptureLayer(el: HTMLElement): boolean {
	const style = window.getComputedStyle(el)
	if (style.pointerEvents === 'none') return false
	if (!coversViewport(el)) return false
	return style.cursor.includes('crosshair') || el.hasAttribute('data-no-clickthrough')
}

const ClickThrough = () => {
	useSyncExternalStore(
		useCallback((_callback) => {
			if (typeof window === 'undefined') return () => {}

			const api = window.interfaceAPI
			const setIgnore = api?.setIgnoreMouseEvents

			if (!setIgnore) return () => {}

			/**
			 * Global click-through for the transparent overlay window.
			 *
			 * Convention — no attributes needed on most components:
			 * 1. Full-screen wrapper: `fixed inset-0 pointer-events-none`
			 * 2. UI panel inside: `pointer-events-auto` (+ visible bg/border if possible)
			 *
			 * Auto-detects: visible UI, media, buttons/inputs, scroll areas, pointer islands.
			 *
			 * Rare overrides:
			 * - `[data-no-clickthrough]` — invisible hit target the heuristics miss
			 * - `[data-clickthrough]` — visible UI that should still pass clicks through
			 */
			const INTERACTIVE_SELECTOR = [
				'[data-no-clickthrough]',
				'iframe',
				'video',
				'audio',
				'canvas',
				'embed',
				'object',
				'img',
				'svg',
				'button',
				'a[href]',
				'input',
				'textarea',
				'select',
				'summary',
				'label',
				'[contenteditable="true"]',
				'[role="button"]',
				'[role="menuitem"]',
				'[role="menuitemcheckbox"]',
				'[role="menuitemradio"]',
				'[role="option"]',
				'[role="switch"]',
				'[role="checkbox"]',
				'[role="tab"]',
				'[role="textbox"]',
				'[role="slider"]',
				'[role="combobox"]',
				'[role="dialog"]',
				'[role="menu"]',
				'[role="listbox"]',
				'[tabindex]:not([tabindex="-1"])',
			].join(',')

			let currentState: boolean | null = null

			const updateState = (shouldIgnore: boolean) => {
				if (currentState === shouldIgnore) return
				currentState = shouldIgnore
				setIgnore(shouldIgnore, shouldIgnore ? { forward: true } : undefined)
			}

			const isScrollable = (el: HTMLElement) => {
				const canScrollY = el.scrollHeight > el.clientHeight + 1
				const canScrollX = el.scrollWidth > el.clientWidth + 1
				if (!canScrollY && !canScrollX) return false

				const style = window.getComputedStyle(el)
				if (canScrollY) {
					const oy = style.overflowY
					if (oy === 'auto' || oy === 'scroll') return true
				}
				if (canScrollX) {
					const ox = style.overflowX
					if (ox === 'auto' || ox === 'scroll') return true
				}
				return false
			}

			const findBlockingHost = (start: HTMLElement | null) => {
				let el: HTMLElement | null = start
				for (let i = 0; i < 30 && el; i++) {
					// Some targets (Document, SVG, or forwarded synthetic events in the
					// transparent overlay window) lack Element.matches — skip them safely
					// so a thrown error can't abort click-through updates mid-drag.
					if (typeof el.matches !== 'function') {
						el = el.parentElement
						continue
					}
					if (el.matches('[data-clickthrough]')) return null
					if (el.matches(INTERACTIVE_SELECTOR)) return el
					if (isFullScreenCaptureLayer(el)) return el
					if (isPointerIsland(el)) return el
					if (isScrollable(el)) return el
					if (isVisuallyBlocking(el)) return el
					el = el.parentElement
				}
				return null
			}

			const handlePointerEvent = (event: PointerEvent) => {
				const target = event.target
				if (!(target instanceof Element)) return
				updateState(!findBlockingHost(target as HTMLElement))
			}

			const handleMouseOut = (event: MouseEvent) => {
				if (!event.relatedTarget) {
					updateState(true)
				}
			}

			const handleBlur = () => updateState(true)

			updateState(true)

			const handleWheelEvent = (event: WheelEvent) => {
				const target = event.target
				if (!(target instanceof Element)) return
				updateState(!findBlockingHost(target as HTMLElement))
			}

			document.addEventListener('pointermove', handlePointerEvent, true)
			document.addEventListener('pointerdown', handlePointerEvent, true)
			document.addEventListener('pointerenter', handlePointerEvent, true)
			document.addEventListener('wheel', handleWheelEvent, { capture: true, passive: true })
			window.addEventListener('mouseout', handleMouseOut)
			window.addEventListener('blur', handleBlur)

			return () => {
				document.removeEventListener('pointermove', handlePointerEvent, true)
				document.removeEventListener('pointerdown', handlePointerEvent, true)
				document.removeEventListener('pointerenter', handlePointerEvent, true)
				document.removeEventListener('wheel', handleWheelEvent, { capture: true })
				window.removeEventListener('mouseout', handleMouseOut)
				window.removeEventListener('blur', handleBlur)
				updateState(true)
			}
		}, []),
		() => null,
		() => null
	)

	return null
}

export default ClickThrough
