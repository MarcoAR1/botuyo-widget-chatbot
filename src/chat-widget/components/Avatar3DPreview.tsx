/**
 * @package @botuyo/chat-widget
 * Avatar3DPreview Component — Lightweight 3D avatar previewer
 *
 * Designed to be generic and used by consumer applications (like the dashboard)
 * to preview avatars without the voice-call pipeline (no lip-sync, no audio reactivity).
 */

'use client'

import { useRef, useEffect, useState, useCallback, type MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { VRMLoaderPlugin, VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AlertTriangle } from 'lucide-react'
import { logger } from '../utils/logger'

interface Avatar3DPreviewProps {
  url: string
  className?: string
  cameraPosition?: [number, number, number]
  targetPosition?: [number, number, number]
  /** Slow idle auto-spin. Default true. */
  autoRotate?: boolean
  /** Allow the user to orbit/zoom with mouse + touch. Default true. */
  interactive?: boolean
  /** Render a soft contact shadow beneath the model. Default true. */
  showShadow?: boolean
  /** Text shown while the model downloads. */
  loadingLabel?: string
  /** Text shown if the model fails to load. */
  errorLabel?: string
  /** Fired once the model has loaded successfully. */
  onLoad?: () => void
  /** Fired if the model fails to load. */
  onError?: (error: unknown) => void
}

// ═══════════════════════════════════════
// VRM/GLB MODEL COMPONENT
// ═══════════════════════════════════════

interface VRMModelPreviewProps {
  url: string
  autoRotate?: boolean
  hasCustomCamera?: boolean
  /** Shared ref the loader writes the framed target height into (for OrbitControls). */
  frameRef: MutableRefObject<{ targetY: number }>
  onLoaded?: () => void
  onError?: (error: unknown) => void
}

function VRMModelPreview({ url, autoRotate, hasCustomCamera, frameRef, onLoaded, onError }: VRMModelPreviewProps) {
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
            frameRef.current.targetY = headY
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
            frameRef.current.targetY = headY
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
        onLoaded?.()
      },
      undefined,
      (error) => {
        logger.error('[Avatar3DPreview] Failed to load model:', error)
        onError?.(error)
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
  }, [url, scene, camera, autoRotate, hasCustomCamera, frameRef, onLoaded, onError])

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
// ORBIT CONTROLS (rotate + zoom)
// ═══════════════════════════════════════

function PreviewControls({
  enabled,
  autoRotate,
  frameRef,
}: {
  enabled: boolean
  autoRotate: boolean
  frameRef: MutableRefObject<{ targetY: number }>
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControls | null>(null)
  const synced = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const controls = new OrbitControls(camera, gl.domElement)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.6
    controls.zoomSpeed = 0.8
    controls.minDistance = 0.15
    controls.maxDistance = 6
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.2
    controlsRef.current = controls
    synced.current = false
    return () => {
      controls.dispose()
      controlsRef.current = null
    }
  }, [enabled, autoRotate, camera, gl])

  useFrame(() => {
    const controls = controlsRef.current
    if (!controls) return
    // Re-center the orbit pivot on the framed head once the loader reports it.
    if (!synced.current && frameRef.current.targetY) {
      controls.target.set(0, frameRef.current.targetY, 0)
      synced.current = true
    }
    controls.update()
  })

  return null
}

// ═══════════════════════════════════════
// EXPORTED COMPONENT
// ═══════════════════════════════════════

type LoadStatus = 'loading' | 'ready' | 'error'

export function Avatar3DPreview({
  url,
  className = '',
  cameraPosition,
  targetPosition,
  autoRotate = true,
  interactive = true,
  showShadow = true,
  loadingLabel = 'Loading 3D model…',
  errorLabel = 'Could not load the 3D model',
  onLoad,
  onError,
}: Avatar3DPreviewProps) {
  // The status is keyed to the url it belongs to, so a source change reads as
  // "loading" immediately (no reset effect that could clobber the load result).
  const [loadState, setLoadState] = useState<{ url: string; status: LoadStatus }>({ url, status: 'loading' })
  const status: LoadStatus = loadState.url === url ? loadState.status : 'loading'
  const frameRef = useRef<{ targetY: number }>({ targetY: 0 })

  const handleLoaded = useCallback(() => {
    setLoadState({ url, status: 'ready' })
    onLoad?.()
  }, [url, onLoad])

  const handleError = useCallback(
    (error: unknown) => {
      setLoadState({ url, status: 'error' })
      onError?.(error)
    },
    [url, onError],
  )

  if (!url) return null

  const hasCustomCamera = !!(cameraPosition && targetPosition)
  // OrbitControls owns rotation while interactive; otherwise the model self-spins.
  const modelAutoRotate = autoRotate && !interactive

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {/* Soft contact shadow grounding the avatar (behind the transparent canvas). */}
      {showShadow && (
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[8%] left-1/2 z-0 h-[10%] w-[55%] -translate-x-1/2 rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 70%)',
            filter: 'blur(2px)',
          }}
        />
      )}

      <Canvas
        key={url}
        className="relative z-10"
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
        camera={{ fov: 30, near: 0.01, far: 10 }}
        dpr={[1, 2]}
      >
        <PreviewCameraSetup position={cameraPosition} target={targetPosition} />
        <PreviewControls enabled={interactive && !hasCustomCamera} autoRotate={autoRotate} frameRef={frameRef} />

        {/* 3-point studio lighting */}
        {/* @ts-ignore */}
        <ambientLight intensity={0.55} />
        {/* @ts-ignore key light */}
        <directionalLight position={[1.5, 2, 3]} intensity={0.9} color="#ffffff" />
        {/* @ts-ignore fill light (cool) */}
        <directionalLight position={[-2, 1, 1.5]} intensity={0.35} color="#b4c6e7" />
        {/* @ts-ignore rim / back light */}
        <directionalLight position={[0, 1.5, -2.5]} intensity={0.5} color="#ffffff" />
        {/* @ts-ignore subtle ground bounce */}
        <pointLight position={[0, -0.5, 0.5]} intensity={0.25} distance={4} />

        <VRMModelPreview
          url={url}
          autoRotate={modelAutoRotate}
          hasCustomCamera={hasCustomCamera}
          frameRef={frameRef}
          onLoaded={handleLoaded}
          onError={handleError}
        />
      </Canvas>

      {status === 'loading' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 text-gray-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
          {loadingLabel && <span className="text-xs">{loadingLabel}</span>}
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 px-3 text-center text-gray-400">
          <AlertTriangle className="h-5 w-5" aria-hidden />
          {errorLabel && <span className="text-xs">{errorLabel}</span>}
        </div>
      )}
    </div>
  )
}
