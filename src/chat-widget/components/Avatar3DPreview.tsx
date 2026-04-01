/**
 * @package @botuyo/chat-widget
 * Avatar3DPreview Component — Lightweight 3D avatar previewer
 *
 * Designed to be generic and used by consumer applications (like the dashboard)
 * to preview avatars without the voice-call pipeline (no lip-sync, no audio reactivity).
 */

'use client'

import { useRef, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface Avatar3DPreviewProps {
  url: string
  className?: string
  cameraPosition?: [number, number, number]
  targetPosition?: [number, number, number]
  autoRotate?: boolean
}

// ═══════════════════════════════════════
// VRM/GLB MODEL COMPONENT
// ═══════════════════════════════════════

function VRMModelPreview({ url, autoRotate, hasCustomCamera }: { url: string; autoRotate?: boolean; hasCustomCamera?: boolean }) {
  const vrmRef = useRef<VRM | null>(null)
  const glbSceneRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const breathPhase = useRef(0)
  const baseRotationY = useRef(0)
  const baseY = useRef(0)
  const { scene, camera } = useThree()

  // Load model using GLTFLoader (with VRM plugin)
  useEffect(() => {
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser) as any)

    loader.load(
      url,
      (gltf) => {
        const vrm = (gltf as any).userData?.vrm as VRM | undefined
        if (vrm) {
          // ── VRM MODEL PATH ──
          vrmRef.current = vrm
          vrm.scene.rotation.y = Math.PI
          const box = new THREE.Box3().setFromObject(vrm.scene)
          const size = box.getSize(new THREE.Vector3())
          
          baseY.current = 0
          baseRotationY.current = Math.PI

          scene.add(vrm.scene)

          // Frame the bust/head 
          if (!hasCustomCamera) {
            const headY = size.y * 0.75 // Approx neck/head level
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
            const frameHeight = size.y * 0.55 // Show head + shoulders
            const cameraZ = (frameHeight * 0.5) / Math.tan(fov / 2) * 1.3 // Pull back 30% more
            
            // Camera placed in front of model at +Z looking backwards at model
            camera.position.set(0, headY, cameraZ)
            camera.lookAt(0, headY, 0)
          }

          // Eyes look straight at camera
          if (vrm.lookAt) {
            vrm.lookAt.target = camera
          }
        } else {
          // ── GLB PATH ──
          const model = gltf.scene
          
          // Force world matrix update
          model.updateMatrixWorld(true)
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // Create pivot wrapper
          const pivot = new THREE.Group()
          model.position.sub(center) // Center geometry
          pivot.add(model)
          
          glbSceneRef.current = pivot
          baseY.current = 0
          baseRotationY.current = 0
          scene.add(pivot)

          // Frame the object
          if (!hasCustomCamera) {
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
            const headY = size.y * 0.3
            const cameraZ = (size.y * 0.5) / Math.tan(fov / 2) * 1.2
            camera.position.set(0, headY, cameraZ) // +Z position
            camera.lookAt(0, headY, 0)
          }
          
          // Play embedded animations if available
          if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model)
            mixerRef.current = mixer
            gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play()
            })
          }
        }
      },
      undefined,
      (error) => {
        console.error('[Avatar3DPreview] Failed to load model:', error)
      }
    )

    return () => {
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene)
        vrmRef.current = null
      }
      if (glbSceneRef.current) {
        scene.remove(glbSceneRef.current)
        glbSceneRef.current = null
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [url, scene, camera, autoRotate])

  // Animation Loop (Subtle Idle only)
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    breathPhase.current += dt * 1.2

    // Apply auto-rotation if requested
    const autoRotSpeed = autoRotate ? dt * 0.5 : 0

    // GLB Animation
    if (glbSceneRef.current) {
      if (mixerRef.current) {
        mixerRef.current.update(dt)
      }
      const glb = glbSceneRef.current
      const breathOffset = Math.sin(breathPhase.current) * 0.003
      glb.position.y = baseY.current + breathOffset
      
      if (autoRotate) {
        baseRotationY.current -= autoRotSpeed
      }
      
      const idleSway = Math.sin(breathPhase.current * 0.3) * 0.02
      glb.rotation.y = baseRotationY.current + idleSway
      return
    }

    // VRM Animation
    const vrm = vrmRef.current
    if (vrm) {
      const breathOffset = Math.sin(breathPhase.current) * 0.003
      vrm.scene.position.y = baseY.current + breathOffset
      
      if (autoRotate) {
        baseRotationY.current -= autoRotSpeed
        vrm.scene.rotation.y = baseRotationY.current
      }

      // Body idle gestures
      if (vrm.humanoid) {
        const spine = vrm.humanoid.getNormalizedBoneNode('spine')
        if (spine) {
          const spineSwayZ = Math.sin(breathPhase.current * 0.4) * 0.008
          const spineSwayX = Math.cos(breathPhase.current * 0.25) * 0.005
          spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, spineSwayZ, 2 * dt)
          spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, spineSwayX, 2 * dt)
        }
      }

      vrm.update(dt)
    }
  })

  return null
}

// ═══════════════════════════════════════
// CAMERA SETUP
// ═══════════════════════════════════════

function PreviewCameraSetup({ 
  position, 
  target 
}: { 
  position?: [number, number, number]
  target?: [number, number, number]
}) {
  const { camera } = useThree()
  useEffect(() => {
    if (position && target) {
      camera.position.set(...position)
      camera.lookAt(...target)
    }
  }, [camera, position, target])
  return null
}

// ═══════════════════════════════════════
// EXPORTED COMPONENT
// ═══════════════════════════════════════

export function Avatar3DPreview({
  url,
  className = '',
  cameraPosition,
  targetPosition,
  autoRotate = true,
}: Avatar3DPreviewProps) {
  if (!url) return null

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Loading 3D Model...</div>}>
        <Canvas
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
          camera={{ fov: 30, near: 0.01, far: 10 }}
          dpr={[1, 2]}
        >
          <PreviewCameraSetup position={cameraPosition} target={targetPosition} />

          {/* Lighting setup based on main widget */}
          {/* @ts-ignore */}
          <ambientLight intensity={0.6} />
          {/* @ts-ignore */}
          <directionalLight position={[1, 2, 3]} intensity={0.8} color="#ffffff" />
          {/* @ts-ignore */}
          <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#b4c6e7" />
          {/* @ts-ignore */}
          <pointLight position={[0, 0.5, -0.5]} intensity={0.5} distance={3} />

          <VRMModelPreview url={url} autoRotate={autoRotate} hasCustomCamera={!!(cameraPosition && targetPosition)} />
        </Canvas>
      </Suspense>
    </div>
  )
}
