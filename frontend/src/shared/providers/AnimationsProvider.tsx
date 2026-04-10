import { createContext, useContext, useState, useSyncExternalStore, useCallback, type ReactNode } from 'react'

/**
 * AnimationId is now derived from the registry — no need to touch this
 * file when adding a new animation.
 */
export type AnimationId = string

interface AnimationsContextType {
    enabledAnimations: Set<string>
    isAnimationEnabled: (id: string) => boolean
    toggleAnimation: (id: string) => void
}

const AnimationsContext = createContext<AnimationsContextType | undefined>(undefined)

export function AnimationsProvider({ children }: { children: ReactNode }) {
    const [enabledAnimations, setEnabledAnimations] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('enabled-animations')
        if (saved) {
            try {
                return new Set(JSON.parse(saved)) as Set<string>
            } catch (e) {
                console.error('Failed to parse enabled animations', e)
            }
        }
        // Default: all registered animations are disabled initially
        return new Set<string>()
    })

    useSyncExternalStore(
        useCallback((_callback) => {
            localStorage.setItem('enabled-animations', JSON.stringify(Array.from(enabledAnimations)))
            return () => { }
        }, [enabledAnimations]),
        () => null,
        () => null
    )

    const isAnimationEnabled = (id: string): boolean => {
        return enabledAnimations.has(id)
    }

    const toggleAnimation = (id: string) => {
        setEnabledAnimations(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    return (
        <AnimationsContext.Provider value={{ enabledAnimations, isAnimationEnabled, toggleAnimation }}>
            {children}
        </AnimationsContext.Provider>
    )
}

export function useAnimations() {
    const context = useContext(AnimationsContext)
    if (context === undefined) {
        throw new Error('useAnimations must be used within an AnimationsProvider')
    }
    return context
}
