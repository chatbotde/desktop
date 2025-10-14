import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 15

    // Renderer setup with specified background color
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    
    // Get container dimensions
    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    
    renderer.setSize(width, height)
    renderer.setClearColor(0x1a2b5c, 1.0) // HSL 226.2 57% 21% converted to hex
    
    // Ensure canvas fills the container completely
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.pointerEvents = 'none'
    
    container.appendChild(renderer.domElement)

    // Simple solid color background - no additional elements needed

    // Simple render loop for solid background
    const animate = () => {
      const id = requestAnimationFrame(animate)
      renderer.render(scene, camera)
      return id
    }
    const animationId = animate()

    // Store refs for cleanup
    sceneRef.current = { scene, camera, renderer, animationId }

    // Handle resize
    const handleResize = () => {
      const container = containerRef.current
      if (!container) return
      
      const width = container.clientWidth || window.innerWidth
      const height = container.clientHeight || window.innerHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    
    // Initial resize to ensure proper sizing
    handleResize()
    
    // Use ResizeObserver for better iframe support
    const resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)
        sceneRef.current.renderer.dispose()
        sceneRef.current.scene.clear()
        if (containerRef.current && sceneRef.current.renderer.domElement) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement)
        }
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    />
  )
}
