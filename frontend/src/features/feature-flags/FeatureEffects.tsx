import type React from "react"

type EffectModule = {
  featureId: string
  FeatureEffect: React.ComponentType
}

const effectModules = import.meta.glob<EffectModule>("./effects/*.effect.tsx", {
  eager: true,
})

export function FeatureEffects() {
  const modules = Object.values(effectModules)
  return (
    <>
      {modules.map((m) => {
        const Effect = m.FeatureEffect
        return <Effect key={m.featureId} />
      })}
    </>
  )
}

