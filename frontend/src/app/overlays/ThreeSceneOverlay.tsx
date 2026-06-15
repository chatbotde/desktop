/**
 * @overlay ThreeSceneOverlay
 * @feature three-scene
 * @description Renders a walking 3D character via react-three-fiber.
 *   The single useEffect inside WalkCharacter is legitimate: it talks to
 *   three.js AnimationMixer (an external non-React system).
 * @featureFlag three-scene-overlay
 * @placement fixed, full-screen, pointer-events-none
 */

import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Center, OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import type { Group } from 'three'
import { GLOBAL_THEME } from '@/global/theme'
import { useFeature } from '@/shared/providers/FeatureProvider'

function WalkCharacter() {
  const groupRef = useRef<Group>(null)
  const { scene, animations } = useGLTF('/walk.glb')
  const { actions } = useAnimations(animations, groupRef)

  // ✅ Legitimate useEffect: controls three.js AnimationMixer (external system).
  // React has no declarative API for three.js animation playback.
  useEffect(() => {
    const firstAction = actions[animations[0]?.name]
    firstAction?.reset().fadeIn(0.2).play()
    return () => { firstAction?.fadeOut(0.2) }
  }, [actions, animations])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.18
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 2.2) * 0.03
  })

  return (
    <group ref={groupRef} scale={0.65}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

export function ThreeSceneOverlay() {
  const { isFeatureEnabled } = useFeature()
  const enabled = isFeatureEnabled('three-scene-overlay')

  useEffect(() => {
    if (enabled) {
      useGLTF.preload('/walk.glb')
    }
  }, [enabled])

  // Always render a fixed shell — returning null here collapses the Electron overlay window.
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: GLOBAL_THEME.zIndex.modal - 1 }}
      aria-hidden={!enabled}
    >
      {enabled && (
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 28 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          className="h-full w-full"
          style={{ pointerEvents: 'none' }}
        >
          <ambientLight intensity={1.55} />
          <directionalLight position={[3, 4, 5]} intensity={2.4} color="#c4f1ff" />
          <directionalLight position={[-4, 1, -2]} intensity={1.1} color="#ffd1e8" />
          <Suspense fallback={null}>
            <WalkCharacter />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      )}
    </div>
  )
}