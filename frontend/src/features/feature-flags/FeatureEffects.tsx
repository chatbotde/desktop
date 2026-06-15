import { Suspense, lazy, useMemo, type ComponentType } from "react"

type EffectModule = {
  featureId: string
  FeatureEffect: ComponentType
}

const effectLoaders = import.meta.glob<EffectModule>("./effects/*.effect.tsx")

function lazyEffect(loader: () => Promise<EffectModule>) {
  return lazy(async () => {
    const module = await loader()
    return { default: module.FeatureEffect }
  })
}

export function FeatureEffects() {
  const lazyEffects = useMemo(
    () => Object.values(effectLoaders).map((loader) => lazyEffect(loader)),
    []
  )

  return (
    <>
      {lazyEffects.map((Effect, index) => (
        <Suspense key={index} fallback={null}>
          <Effect />
        </Suspense>
      ))}
    </>
  )
}
