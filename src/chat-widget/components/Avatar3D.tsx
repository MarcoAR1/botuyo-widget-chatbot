/**
 * @package @botuyo/chat-widget
 * Avatar3D Component — Lazy-loaded 3D avatar for voice calls
 *
 * Uses React Three Fiber + @pixiv/three-vrm to render VRM models
 * with emotion-driven blendshapes and idle animations.
 *
 * This component is loaded via React.lazy() — it adds 0KB to the
 * main bundle. Three.js + VRM are only downloaded when a tenant
 * has avatar3dUrl configured.
 */

'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMExpressionPresetName, VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking'

interface Avatar3DProps {
  modelUrl: string
  emotion: string | null
  callState: CallState
  audioLevel: number
  primaryColor: string
  size: number
}

// ═══════════════════════════════════════
// EMOTION → VRM BLENDSHAPE MAPPING
// ═══════════════════════════════════════

interface EmotionConfig {
  expressions: Record<string, number>  // VRM expression name → weight 0-1
  headRotation?: [number, number, number]  // euler XYZ in radians
}

const EMOTION_MAP: Record<string, EmotionConfig> = {
  default: {
    expressions: { [VRMExpressionPresetName.Neutral]: 1 },
  },
  happy: {
    expressions: { [VRMExpressionPresetName.Happy]: 0.8 },
  },
  angry: {
    expressions: { [VRMExpressionPresetName.Angry]: 0.7 },
    headRotation: [0.05, 0, 0],
  },
  sorry: {
    expressions: { [VRMExpressionPresetName.Sad]: 0.6 },
    headRotation: [-0.08, 0, 0],
  },
  confused: {
    expressions: { [VRMExpressionPresetName.Sad]: 0.3 },
    headRotation: [0, 0, 0.08],
  },
  love: {
    expressions: { [VRMExpressionPresetName.Happy]: 0.9, [VRMExpressionPresetName.Relaxed]: 0.4 },
  },
  thinking: {
    expressions: { [VRMExpressionPresetName.Neutral]: 0.6 },
    headRotation: [0.06, -0.1, 0],
  },
  writing: {
    expressions: { [VRMExpressionPresetName.Neutral]: 0.8 },
    headRotation: [-0.05, 0, 0],
  },
  wink: {
    expressions: { [VRMExpressionPresetName.Happy]: 0.5, [VRMExpressionPresetName.Blink]: 0.9 },
  },
}

// ═══════════════════════════════════════
// VRM MODEL COMPONENT (inside Canvas)
// ═══════════════════════════════════════

interface VRMModelProps {
  url: string
  emotion: string | null
  callState: CallState
  audioLevel: number
}

function VRMModel({ url, emotion, callState, audioLevel }: VRMModelProps) {
  const vrmRef = useRef<VRM | null>(null)
  const glbSceneRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const baseRotationY = useRef(0)
  const baseScale = useRef(1)
  const blinkTimer = useRef(0)
  const nextBlinkAt = useRef(Math.random() * 3 + 2)
  const breathPhase = useRef(0)
  const currentExpressions = useRef<Record<string, number>>({})
  const targetExpressions = useRef<Record<string, number>>({})
  const headTarget = useRef(new THREE.Euler(0, 0, 0))
  const baseY = useRef(0)
  const { scene, camera } = useThree()

  // Load model using Three.js GLTFLoader (with VRM plugin for VRM models)
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
          const center = box.getCenter(new THREE.Vector3())
          const height = box.getSize(new THREE.Vector3()).y
          vrm.scene.position.y = -center.y - height * 0.05
          baseY.current = vrm.scene.position.y
          scene.add(vrm.scene)
        } else {
          // ── PLAIN GLB FALLBACK ──
          console.info('[Avatar3D] Plain GLB model detected, using fallback animations')
          const model = gltf.scene

          // Force world matrix update so bbox is accurate
          model.updateMatrixWorld(true)
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // Create pivot wrapper for proper rotation around geometric center
          const pivot = new THREE.Group()

          // Center model geometry at pivot origin
          model.position.sub(center)
          pivot.add(model)

          // Don't rotate the model — move the CAMERA to the front instead
          baseRotationY.current = 0

          glbSceneRef.current = pivot
          baseY.current = 0
          baseScale.current = 1
          scene.add(pivot)

          // Frame the HEAD: camera at -Z (model faces -Z based on tests)
          const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
          const headY = size.y * 0.35
          const cameraZ = (size.y * 0.5) / Math.tan(fov / 2)
          // Camera on the -Z side to see the model's FRONT
          camera.position.set(0, headY, -cameraZ)
          camera.lookAt(0, headY, 0)

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
        console.error('[Avatar3D] Failed to load model:', error)
      },
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
  }, [url, scene])

  // Update target expressions when emotion changes (VRM only)
  useEffect(() => {
    const config = EMOTION_MAP[emotion || 'default'] || EMOTION_MAP.default
    targetExpressions.current = config.expressions
    if (config.headRotation) {
      headTarget.current.set(...config.headRotation)
    } else {
      headTarget.current.set(0, 0, 0)
    }
  }, [emotion])

  // Animation loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1) // Cap delta to avoid jumps
    breathPhase.current += dt * 1.2

    // ── GLB FALLBACK ANIMATION ──
    const glb = glbSceneRef.current
    if (glb) {
      // Update animation mixer if present
      if (mixerRef.current) {
        mixerRef.current.update(dt)
      }

      // Gentle breathing bob
      const breathOffset = Math.sin(breathPhase.current) * 0.003
      glb.position.y = baseY.current + breathOffset

      // Subtle idle rotation (relative to base facing direction)
      const idleSway = Math.sin(breathPhase.current * 0.3) * 0.02
      glb.rotation.y = baseRotationY.current + idleSway

      // Audio-reactive scale pulse when speaking
      if (callState === 'speaking' && audioLevel > 0.01) {
        const pulse = 1 + audioLevel * 0.03
        const targetScale = baseScale.current * pulse
        const currentScale = glb.scale.x
        glb.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.1))
      } else {
        // Return to base scale smoothly
        const currentScale = glb.scale.x
        if (Math.abs(currentScale - baseScale.current) > 0.001) {
          glb.scale.setScalar(THREE.MathUtils.lerp(currentScale, baseScale.current, 0.05))
        }
      }

      return // Skip VRM-specific code
    }

    // ── VRM ANIMATION (original code) ──
    const vrm = vrmRef.current
    if (!vrm) return

    // ── BREATHING ──
    const breathOffset = Math.sin(breathPhase.current) * 0.003
    vrm.scene.position.y = baseY.current + breathOffset

    // ── BLINKING ──
    blinkTimer.current += dt
    if (blinkTimer.current >= nextBlinkAt.current) {
      const blinkProgress = (blinkTimer.current - nextBlinkAt.current) / 0.15
      if (blinkProgress < 1) {
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, blinkProgress)
      } else if (blinkProgress < 2) {
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 2 - blinkProgress)
      } else {
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, 0)
        blinkTimer.current = 0
        nextBlinkAt.current = Math.random() * 4 + 2
      }
    }

    // ── EMOTION BLENDING ──
    const lerpSpeed = 4 * dt
    const allKeys = new Set([
      ...Object.keys(currentExpressions.current),
      ...Object.keys(targetExpressions.current),
    ])

    for (const key of allKeys) {
      const current = currentExpressions.current[key] || 0
      const target = targetExpressions.current[key] || 0
      const next = THREE.MathUtils.lerp(current, target, lerpSpeed)
      currentExpressions.current[key] = next

      // Don't override blink during active blink animation
      if (key === VRMExpressionPresetName.Blink && blinkTimer.current >= nextBlinkAt.current) continue

      vrm.expressionManager?.setValue(key, next)
    }

    // ── SPEAKING MOUTH ──
    if (callState === 'speaking' && audioLevel > 0.01) {
      const mouthTarget = Math.min(audioLevel * 1.5, 0.8)
      const currentMouth = vrm.expressionManager?.getValue(VRMExpressionPresetName.Aa) || 0
      const smoothMouth = THREE.MathUtils.lerp(currentMouth, mouthTarget, 8 * dt)
      vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, smoothMouth)
    } else {
      const currentMouth = vrm.expressionManager?.getValue(VRMExpressionPresetName.Aa) || 0
      if (currentMouth > 0.01) {
        vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, currentMouth * 0.9)
      }
    }

    // ── HEAD MOVEMENT ──
    if (vrm.humanoid) {
      const head = vrm.humanoid.getNormalizedBoneNode('head')
      if (head) {
        const idleSwayX = Math.sin(breathPhase.current * 0.3) * 0.01
        const idleSwayZ = Math.cos(breathPhase.current * 0.2) * 0.005

        const targetX = headTarget.current.x + idleSwayX
        const targetY = headTarget.current.y
        const targetZ = headTarget.current.z + idleSwayZ

        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, targetX, 3 * dt)
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetY, 3 * dt)
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, targetZ, 3 * dt)
      }
    }

    // ── CALL STATE REACTIONS ──
    if (callState === 'listening' && vrm.humanoid) {
      const head = vrm.humanoid.getNormalizedBoneNode('head')
      if (head) {
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, 0.03, 2 * dt)
      }
    }

    // Update VRM (required for expression changes to take effect)
    vrm.update(dt)
  })

  return null
}

// ═══════════════════════════════════════
// AUTO CAMERA FRAMING
// ═══════════════════════════════════════

function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => {
    // Default camera position — will be overridden by model loader for GLB
    // For VRM: fixed head-level framing
    camera.position.set(0, 0.1, 0.6)
    camera.lookAt(0, 0.1, 0)
  }, [camera])
  return null
}

// ═══════════════════════════════════════
// MAIN AVATAR 3D COMPONENT (exported)
// ═══════════════════════════════════════

export default function Avatar3D({
  modelUrl,
  emotion,
  callState,
  audioLevel,
  primaryColor,
  size,
}: Avatar3DProps) {
  const glowIntensity = useMemo(() => {
    switch (callState) {
      case 'speaking': return 0.6
      case 'listening': return 0.4
      case 'thinking': return 0.3
      default: return 0.15
    }
  }, [callState])

  const isActive = callState === 'listening' || callState === 'speaking'

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Glow ring behind canvas */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow: isActive
            ? `0 0 0 3px ${primaryColor}50, 0 0 30px ${primaryColor}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}, 0 0 60px ${primaryColor}20`
            : `0 0 0 2px ${primaryColor}25`,
          transition: 'box-shadow 0.5s ease',
        }}
      >
        <Canvas
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
          camera={{ fov: 30, near: 0.01, far: 10 }}
          dpr={[1, 2]}
        >
          <CameraSetup />

          {/* Lighting — soft studio setup */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 2, 3]} intensity={0.8} color="#ffffff" />
          <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#b4c6e7" />

          {/* Rim light for depth — matches primary color */}
          <pointLight
            position={[0, 0.5, -0.5]}
            intensity={glowIntensity * 2}
            color={primaryColor}
            distance={3}
          />

          <VRMModel
            url={modelUrl}
            emotion={emotion}
            callState={callState}
            audioLevel={audioLevel}
          />
        </Canvas>
      </div>
    </div>
  )
}
