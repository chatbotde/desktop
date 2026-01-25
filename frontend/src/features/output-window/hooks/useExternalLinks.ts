import { useCallback, useEffect, useRef } from 'react'

/**
 * Hook to intercept link clicks and open them in the system's default browser
 * using Electron's shell.openExternal API.
 * 
 * @returns A ref to attach to the container element
 */
export function useExternalLinks<T extends HTMLElement = HTMLDivElement>() {
    const containerRef = useRef<T>(null)

    const handleClick = useCallback((event: MouseEvent) => {
        // Find the closest anchor element
        const target = event.target as HTMLElement
        const anchor = target.closest('a')

        if (!anchor) return

        const href = anchor.getAttribute('href')
        if (!href) return

        // Only handle http/https/mailto links
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
            return
        }

        // Prevent default browser navigation
        event.preventDefault()
        event.stopPropagation()

        // Use Electron's shell.openExternal if available
        if (window.electronAPI?.shell?.openExternal) {
            window.electronAPI.shell.openExternal(href).catch((error: Error) => {
                console.error('[useExternalLinks] Failed to open external link:', error)
                // Fallback to window.open if shell fails
                window.open(href, '_blank', 'noopener,noreferrer')
            })
        } else {
            // Fallback for non-Electron environment
            window.open(href, '_blank', 'noopener,noreferrer')
        }
    }, [])

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('click', handleClick, true)

        return () => {
            container.removeEventListener('click', handleClick, true)
        }
    }, [handleClick])

    return containerRef
}

/**
 * Opens a URL in the system's default browser
 * @param url - The URL to open
 */
export async function openExternalLink(url: string): Promise<void> {
    if (!url) return

    // Validate URL
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        console.warn('[openExternalLink] Invalid URL protocol:', url)
        return
    }

    if (window.electronAPI?.shell?.openExternal) {
        try {
            await window.electronAPI.shell.openExternal(url)
        } catch (error) {
            console.error('[openExternalLink] Failed to open external link:', error)
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    } else {
        window.open(url, '_blank', 'noopener,noreferrer')
    }
}
