import { useEffect } from 'react'

const ClickThrough = () => {
	useEffect(() => {
		if (typeof window === 'undefined') return

		const api = window.interfaceAPI
		const setIgnore = api?.setIgnoreMouseEvents

		if (!setIgnore) return

		let currentState: boolean | null = null

		const updateState = (shouldIgnore: boolean) => {
			if (currentState === shouldIgnore) return
			currentState = shouldIgnore
			setIgnore(shouldIgnore, shouldIgnore ? { forward: true } : undefined)
		}

		const handlePointerEvent = (event: PointerEvent) => {
			const target = event.target as HTMLElement | null
			if (!target) return

			const interactiveHost = target.closest('[data-no-clickthrough]')
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
	}, [])

	return null
}

export default ClickThrough
