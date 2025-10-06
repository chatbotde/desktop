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

    // Renderer setup with dark background
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0a0a, 0.95) // Very dark, almost black
    containerRef.current.appendChild(renderer.domElement)

    // Dark gradient background sphere
    const bgGeometry = new THREE.SphereGeometry(100, 32, 32)
    const bgMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        color1: { value: new THREE.Color(0x0f0f0f) }, // Deep black
        color2: { value: new THREE.Color(0x1a1a2e) }, // Dark blue-black
        color3: { value: new THREE.Color(0x16213e) }, // Subtle dark blue
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec3 vPosition;
        void main() {
          float h = normalize(vPosition).y;
          vec3 color = mix(color1, color2, smoothstep(-1.0, 0.0, h));
          color = mix(color, color3, smoothstep(0.0, 1.0, h));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
    const bgSphere = new THREE.Mesh(bgGeometry, bgMaterial)
    scene.add(bgSphere)

    // Subtle ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    scene.add(ambientLight)

    // Soft point lights for glass effect
    const light1 = new THREE.PointLight(0x4a90e2, 0.8, 50)
    light1.position.set(10, 10, 10)
    scene.add(light1)

    const light2 = new THREE.PointLight(0x7b68ee, 0.6, 50)
    light2.position.set(-10, -5, 5)
    scene.add(light2)

    // Floating glass-like particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 800
    const posArray = new Float32Array(particlesCount * 3)
    const sizeArray = new Float32Array(particlesCount)

    for (let i = 0; i < particlesCount; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * 40
      posArray[i * 3 + 1] = (Math.random() - 0.5) * 40
      posArray[i * 3 + 2] = (Math.random() - 0.5) * 40
      sizeArray[i] = Math.random() * 3 + 1
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1))

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        void main() {
          vAlpha = size / 4.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * vAlpha * 0.4;
          vec3 color = mix(vec3(0.3, 0.5, 0.8), vec3(0.5, 0.4, 0.9), vAlpha);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    // Floating glass panels for depth
    const glassPanels: THREE.Mesh[] = []
    for (let i = 0; i < 5; i++) {
      const panelGeometry = new THREE.PlaneGeometry(8, 8, 1, 1)
      const panelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a2e,
        metalness: 0.1,
        roughness: 0.1,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      })
      const panel = new THREE.Mesh(panelGeometry, panelMaterial)
      panel.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      )
      panel.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      glassPanels.push(panel)
      scene.add(panel)
    }

    // Animation
    const startTime = performance.now()
    const animate = () => {
      const id = requestAnimationFrame(animate)
      const elapsed = (performance.now() - startTime) / 1000

      // Update particle shader time
      particlesMaterial.uniforms.time.value = elapsed

      // Gentle particle rotation
      particles.rotation.y = elapsed * 0.05
      particles.rotation.x = Math.sin(elapsed * 0.1) * 0.1

      // Smooth camera movement
      camera.position.x = Math.sin(elapsed * 0.1) * 2
      camera.position.y = Math.cos(elapsed * 0.15) * 1.5
      camera.lookAt(0, 0, 0)

      // Animate glass panels
      glassPanels.forEach((panel, i) => {
        panel.rotation.x += 0.001 * (i + 1)
        panel.rotation.y += 0.0015 * (i + 1)
        panel.position.y += Math.sin(elapsed + i) * 0.002
      })

      // Animate lights
      light1.position.x = Math.sin(elapsed * 0.5) * 10
      light1.position.z = Math.cos(elapsed * 0.5) * 10
      light2.position.x = Math.cos(elapsed * 0.3) * -10
      light2.position.z = Math.sin(elapsed * 0.3) * 10

      renderer.render(scene, camera)
      return id
    }
    const animationId = animate()

    // Store refs for cleanup
    sceneRef.current = { scene, camera, renderer, animationId }

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
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
      style={{ zIndex: 0 }}
    />
  )
}
