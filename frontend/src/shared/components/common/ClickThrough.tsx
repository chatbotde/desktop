import { useSyncExternalStore, useCallback } from 'react'

const ClickThrough = () => {
	useSyncExternalStore(
		useCallback((_callback) => {
			if (typeof window === 'undefined') return () => {}

			const api = window.interfaceAPI
			const setIgnore = api?.setIgnoreMouseEvents

			if (!setIgnore) return () => {}

			/**
			 * Global rule:
			 * - Default to click-through (ignore mouse events) for the transparent overlay window.
			 * - Automatically DISABLE click-through when the cursor is over any "interactive UI" element
			 *   (buttons/inputs/links/radix popovers/etc.) OR a scrollable container.
			 *
			 * This removes the need to manually add `data-no-clickthrough` everywhere.
			 *
			 * Manual overrides supported:
			 * - `[data-no-clickthrough]` or `[data-on-clickthrough]`: force treat as interactive
			 */
			const INTERACTIVE_SELECTOR =
				[
					'[data-no-clickthrough]',
					'[data-on-clickthrough]',
					'button',
					'a[href]',
					'input',
					'textarea',
					'select',
					'summary',
					'[contenteditable="true"]',
					// ARIA roles used by Radix/shadcn and custom components
					'[role="button"]',
					'[role="menuitem"]',
					'[role="menuitemcheckbox"]',
					'[role="menuitemradio"]',
					'[role="option"]',
					'[role="switch"]',
					'[role="checkbox"]',
					'[role="tab"]',
					'[role="textbox"]',
					// Keyboard-focusable elements are usually interactive
					'[tabindex]:not([tabindex="-1"])',
				].join(',')

			let currentState: boolean | null = null

			const updateState = (shouldIgnore: boolean) => {
				if (currentState === shouldIgnore) return
				currentState = shouldIgnore
				setIgnore(shouldIgnore, shouldIgnore ? { forward: true } : undefined)
			}

			const isScrollable = (el: HTMLElement) => {
				// Fast checks first (avoid getComputedStyle when possible)
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

			const findInteractiveHost = (start: HTMLElement | null) => {
				let el: HTMLElement | null = start
				// Limit traversal to keep pointermove cheap
				for (let i = 0; i < 20 && el; i++) {
					if (el.matches(INTERACTIVE_SELECTOR)) return el
					if (isScrollable(el)) return el
					el = el.parentElement
				}
				return null
			}

			const handlePointerEvent = (event: PointerEvent) => {
				const target = event.target as HTMLElement | null
				if (!target) return

				const interactiveHost = findInteractiveHost(target)
				updateState(!interactiveHost)
			}

			const handleMouseOut = (event: MouseEvent) => {
				if (!event.relatedTarget) {
					updateState(true)
				}
			}

			const handleBlur = () => updateState(true)

			updateState(true)

			document.addEventListener('pointermove', handlePointerEvent, true)
			document.addEventListener('pointerenter', handlePointerEvent, true)
			window.addEventListener('mouseout', handleMouseOut)
			window.addEventListener('blur', handleBlur)

			return () => {
				document.removeEventListener('pointermove', handlePointerEvent, true)
				document.removeEventListener('pointerenter', handlePointerEvent, true)
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
