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

// React Three Fiber types are resolved via tsconfig
'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { VRMLoaderPlugin, VRMExpressionPresetName, VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { computeGlbFraming, selectIdleClip } from '../utils/avatar3d'

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
  expressions: Record<string, number> // VRM expression name → weight 0-1
  headRotation?: [number, number, number] // euler XYZ in radians
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
// ARKit / READY PLAYER ME BLENDSHAPE SUPPORT
// ═══════════════════════════════════════

interface ARKitEmotionConfig {
  morphs: Record<string, number> // ARKit morph target name → weight 0-1
  headRotation?: [number, number, number]
}

const ARKIT_EMOTION_MAP: Record<string, ARKitEmotionConfig> = {
  default: { morphs: {} },
  happy: {
    morphs: {
      mouthSmileLeft: 0.7,
      mouthSmileRight: 0.7,
      cheekSquintLeft: 0.3,
      cheekSquintRight: 0.3,
    },
  },
  angry: {
    morphs: {
      browDownLeft: 0.7,
      browDownRight: 0.7,
      mouthFrownLeft: 0.4,
      mouthFrownRight: 0.4,
      noseSneerLeft: 0.3,
      noseSneerRight: 0.3,
    },
    headRotation: [0.05, 0, 0],
  },
  sorry: {
    morphs: { browInnerUp: 0.6, mouthFrownLeft: 0.4, mouthFrownRight: 0.4 },
    headRotation: [-0.08, 0, 0],
  },
  confused: {
    morphs: { browInnerUp: 0.5, browOuterUpLeft: 0.3, mouthFrownLeft: 0.2, mouthFrownRight: 0.2 },
    headRotation: [0, 0, 0.08],
  },
  love: {
    morphs: {
      mouthSmileLeft: 0.9,
      mouthSmileRight: 0.9,
      cheekSquintLeft: 0.5,
      cheekSquintRight: 0.5,
    },
  },
  thinking: {
    morphs: { browInnerUp: 0.3, eyeSquintLeft: 0.2, eyeSquintRight: 0.2 },
    headRotation: [0.06, -0.1, 0],
  },
  wink: {
    morphs: { eyeBlinkLeft: 0.9, mouthSmileLeft: 0.5, mouthSmileRight: 0.3 },
  },
}

type MorphMesh = THREE.Mesh & {
  morphTargetDictionary: Record<string, number>
  morphTargetInfluences: number[]
}

function findMorphMeshes(root: THREE.Object3D): MorphMesh[] {
  const meshes: MorphMesh[] = []
  root.traverse(child => {
    if (
      (child as THREE.Mesh).isMesh &&
      (child as THREE.Mesh).morphTargetDictionary &&
      (child as THREE.Mesh).morphTargetInfluences
    ) {
      meshes.push(child as MorphMesh)
    }
  })
  return meshes
}

function setMorphTarget(meshes: MorphMesh[], name: string, value: number) {
  for (const mesh of meshes) {
    const idx = mesh.morphTargetDictionary[name]
    if (idx !== undefined) {
      mesh.morphTargetInfluences[idx] = value
    }
  }
}

function getMorphTarget(meshes: MorphMesh[], name: string): number {
  for (const mesh of meshes) {
    const idx = mesh.morphTargetDictionary[name]
    if (idx !== undefined) return mesh.morphTargetInfluences[idx] || 0
  }
  return 0
}

function hasMorphTarget(meshes: MorphMesh[], name: string): boolean {
  return meshes.some(m => m.morphTargetDictionary[name] !== undefined)
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
  const morphMeshesRef = useRef<MorphMesh[]>([]) // ARKit/RPM morph target meshes
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const baseRotationY = useRef(0)
  const baseScale = useRef(1)
  const blinkTimer = useRef(0)
  const nextBlinkAt = useRef(3.5) // Initial value, randomized in useFrame
  const breathPhase = useRef(0)
  const visemePhase = useRef(0) // Phase for multi-viseme lip sync cycling
  const currentExpressions = useRef<Record<string, number>>({})
  const targetExpressions = useRef<Record<string, number>>({})
  const currentMorphTargets = useRef<Record<string, number>>({}) // ARKit morph lerp state
  const targetMorphTargets = useRef<Record<string, number>>({}) // ARKit morph targets
  const headTarget = useRef(new THREE.Euler(0, 0, 0))
  const baseY = useRef(0)
  const { scene, camera } = useThree()

  // Load model using Three.js GLTFLoader (with VRM plugin for VRM models)
  useEffect(() => {
    const loader = new GLTFLoader()
    loader.register(parser => new VRMLoaderPlugin(parser) as any)

    loader.load(
      url,
      gltf => {
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

          // Eyes look straight at camera (forward-facing)
          if (vrm.lookAt) {
            vrm.lookAt.target = camera
          }
        } else {
          // ── GLB PATH (Ready Player Me / plain GLB) ──
          const model = gltf.scene

          // Scan for meshes with morph targets (ARKit blendshapes)
          const morphMeshes = findMorphMeshes(model)
          morphMeshesRef.current = morphMeshes
          if (morphMeshes.length > 0) {
            const sampleNames = Object.keys(morphMeshes[0].morphTargetDictionary).slice(0, 5)
            console.info(
              `[Avatar3D] GLB with ${morphMeshes.length} morph meshes detected. Sample blendshapes: ${sampleNames.join(', ')}`
            )
          } else {
            console.info(
              '[Avatar3D] Plain GLB model detected (no morph targets), using basic fallback animations'
            )
          }

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

          // Frame head + shoulders from the FRONT (+Z): glTF / Ready-Player-Me
          // avatars face +Z, so the camera must sit on +Z — otherwise the call
          // renders the back of the head ("de espaldas").
          const framing = computeGlbFraming(
            { x: size.x, y: size.y, z: size.z },
            (camera as THREE.PerspectiveCamera).fov,
            'bust'
          )
          camera.position.set(...framing.position)
          camera.lookAt(...framing.target)

          // Only auto-play a genuine idle loop. Playing every embedded clip (or a
          // locomotion/jump clip) makes game-character GLBs jump around the frame.
          const idleClip = selectIdleClip(gltf.animations)
          if (idleClip) {
            const mixer = new THREE.AnimationMixer(model)
            mixerRef.current = mixer
            mixer.clipAction(idleClip).play()
          }
        }
      },
      undefined,
      error => {
        console.error('[Avatar3D] Failed to load model:', error)
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
  }, [url, scene])

  // Update target expressions when emotion changes
  useEffect(() => {
    // VRM path
    const vrmConfig = EMOTION_MAP[emotion || 'default'] || EMOTION_MAP.default
    targetExpressions.current = vrmConfig.expressions

    // ARKit/GLB path
    const arkitConfig = ARKIT_EMOTION_MAP[emotion || 'default'] || ARKIT_EMOTION_MAP.default
    targetMorphTargets.current = arkitConfig.morphs

    // Head rotation (shared)
    const headRot = vrmConfig.headRotation || arkitConfig.headRotation
    if (headRot) {
      headTarget.current.set(...headRot)
    } else {
      headTarget.current.set(0, 0, 0)
    }
  }, [emotion])

  // Animation loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1) // Cap delta to avoid jumps
    breathPhase.current += dt * 1.2

    // ── GLB / READY PLAYER ME ANIMATION ──
    const glb = glbSceneRef.current
    if (glb) {
      const morphs = morphMeshesRef.current

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

      // ── ARKit BLINKING ──
      if (morphs.length > 0 && hasMorphTarget(morphs, 'eyeBlinkLeft')) {
        blinkTimer.current += dt
        if (blinkTimer.current >= nextBlinkAt.current) {
          const blinkProgress = (blinkTimer.current - nextBlinkAt.current) / 0.15
          if (blinkProgress < 1) {
            setMorphTarget(morphs, 'eyeBlinkLeft', blinkProgress)
            setMorphTarget(morphs, 'eyeBlinkRight', blinkProgress)
          } else if (blinkProgress < 2) {
            setMorphTarget(morphs, 'eyeBlinkLeft', 2 - blinkProgress)
            setMorphTarget(morphs, 'eyeBlinkRight', 2 - blinkProgress)
          } else {
            setMorphTarget(morphs, 'eyeBlinkLeft', 0)
            setMorphTarget(morphs, 'eyeBlinkRight', 0)
            blinkTimer.current = 0
            nextBlinkAt.current = Math.random() * 4 + 2
          }
        }
      }

      // ── ARKit EMOTION BLENDING ──
      if (morphs.length > 0) {
        const allMorphKeys = new Set([
          ...Object.keys(currentMorphTargets.current),
          ...Object.keys(targetMorphTargets.current),
        ])
        for (const key of allMorphKeys) {
          // Skip blink morphs during active blink animation
          if (
            (key === 'eyeBlinkLeft' || key === 'eyeBlinkRight') &&
            blinkTimer.current >= nextBlinkAt.current
          )
            continue
          const current = currentMorphTargets.current[key] || 0
          const target = targetMorphTargets.current[key] || 0
          const next = THREE.MathUtils.lerp(current, target, 4 * dt)
          currentMorphTargets.current[key] = next
          setMorphTarget(morphs, key, next)
        }
      }

      // ── ARKit / RPM MULTI-VISEME LIP SYNC ──
      if (morphs.length > 0 && callState === 'speaking' && audioLevel > 0.01) {
        visemePhase.current += dt * 12
        const amp = Math.min(audioLevel * 1.5, 0.8)
        const p = visemePhase.current

        // Ready Player Me viseme blendshapes (Oculus naming)
        const hasRPMVisemes = hasMorphTarget(morphs, 'viseme_aa')
        if (hasRPMVisemes) {
          const rpmVisemes: [string, number][] = [
            ['viseme_aa', Math.max(0, Math.sin(p * 1.0)) * amp],
            ['viseme_E', Math.max(0, Math.sin(p * 1.7 + 1.2)) * amp * 0.6],
            ['viseme_I', Math.max(0, Math.sin(p * 2.3 + 2.5)) * amp * 0.4],
            ['viseme_O', Math.max(0, Math.sin(p * 1.3 + 3.8)) * amp * 0.7],
            ['viseme_U', Math.max(0, Math.sin(p * 1.9 + 5.0)) * amp * 0.5],
          ]
          for (const [name, target] of rpmVisemes) {
            const current = getMorphTarget(morphs, name)
            setMorphTarget(morphs, name, THREE.MathUtils.lerp(current, target, 8 * dt))
          }
        } else if (hasMorphTarget(morphs, 'jawOpen')) {
          // Fallback: generic ARKit jaw-based lip sync
          const jawTarget = Math.min(audioLevel * 1.2, 0.7)
          const currentJaw = getMorphTarget(morphs, 'jawOpen')
          setMorphTarget(morphs, 'jawOpen', THREE.MathUtils.lerp(currentJaw, jawTarget, 8 * dt))
          if (hasMorphTarget(morphs, 'mouthOpen')) {
            setMorphTarget(
              morphs,
              'mouthOpen',
              THREE.MathUtils.lerp(getMorphTarget(morphs, 'mouthOpen'), jawTarget * 0.6, 8 * dt)
            )
          }
        }
      } else if (morphs.length > 0) {
        // Smoothly close all viseme morphs when not speaking
        const visemeNames = [
          'viseme_aa',
          'viseme_E',
          'viseme_I',
          'viseme_O',
          'viseme_U',
          'viseme_CH',
          'viseme_DD',
          'viseme_FF',
          'viseme_kk',
          'viseme_nn',
          'viseme_PP',
          'viseme_RR',
          'viseme_SS',
          'viseme_TH',
          'viseme_sil',
          'jawOpen',
          'mouthOpen',
        ]
        for (const name of visemeNames) {
          const current = getMorphTarget(morphs, name)
          if (current > 0.01) {
            setMorphTarget(morphs, name, current * 0.85)
          }
        }
      }

      // Audio-reactive scale pulse when speaking (for models without morph targets)
      if (callState === 'speaking' && audioLevel > 0.01) {
        const pulse = 1 + audioLevel * 0.03
        const targetScale = baseScale.current * pulse
        const currentScale = glb.scale.x
        glb.scale.setScalar(THREE.MathUtils.lerp(currentScale, targetScale, 0.1))
      } else {
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
      if (key === VRMExpressionPresetName.Blink && blinkTimer.current >= nextBlinkAt.current)
        continue

      vrm.expressionManager?.setValue(key, next)
    }

    // ── MULTI-VISEME LIP SYNC ──
    // Cycles through Aa, Ee, Ih, Oh, Ou at different frequencies
    // driven by audioLevel — simulates natural speech mouth shapes
    if (callState === 'speaking' && audioLevel > 0.01) {
      visemePhase.current += dt * 12 // ~12Hz cycling for natural speech cadence
      const amp = Math.min(audioLevel * 1.5, 0.8)
      const p = visemePhase.current

      // Each viseme gets a sine wave at a different frequency for variety
      const visemes: [string, number][] = [
        [VRMExpressionPresetName.Aa, Math.max(0, Math.sin(p * 1.0)) * amp],
        [VRMExpressionPresetName.Ee, Math.max(0, Math.sin(p * 1.7 + 1.2)) * amp * 0.6],
        [VRMExpressionPresetName.Ih, Math.max(0, Math.sin(p * 2.3 + 2.5)) * amp * 0.4],
        [VRMExpressionPresetName.Oh, Math.max(0, Math.sin(p * 1.3 + 3.8)) * amp * 0.7],
        [VRMExpressionPresetName.Ou, Math.max(0, Math.sin(p * 1.9 + 5.0)) * amp * 0.5],
      ]

      for (const [name, target] of visemes) {
        const current = vrm.expressionManager?.getValue(name) || 0
        vrm.expressionManager?.setValue(name, THREE.MathUtils.lerp(current, target, 8 * dt))
      }
    } else {
      // Smoothly close all visemes when not speaking
      const visemeNames = [
        VRMExpressionPresetName.Aa,
        VRMExpressionPresetName.Ee,
        VRMExpressionPresetName.Ih,
        VRMExpressionPresetName.Oh,
        VRMExpressionPresetName.Ou,
      ]
      for (const name of visemeNames) {
        const current = vrm.expressionManager?.getValue(name) || 0
        if (current > 0.01) {
          vrm.expressionManager?.setValue(name, current * 0.85)
        }
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

    // ── BODY IDLE GESTURES ──
    // Subtle spine sway and shoulder micro-movement for lifelike presence
    if (vrm.humanoid) {
      const spine = vrm.humanoid.getNormalizedBoneNode('spine')
      if (spine) {
        const spineSwayZ = Math.sin(breathPhase.current * 0.4) * 0.008
        const spineSwayX = Math.cos(breathPhase.current * 0.25) * 0.005
        spine.rotation.z = THREE.MathUtils.lerp(spine.rotation.z, spineSwayZ, 2 * dt)
        spine.rotation.x = THREE.MathUtils.lerp(spine.rotation.x, spineSwayX, 2 * dt)
      }

      const leftArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm')
      const rightArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm')
      if (leftArm) {
        const armSway = Math.sin(breathPhase.current * 0.35 + 0.5) * 0.01
        leftArm.rotation.z = THREE.MathUtils.lerp(leftArm.rotation.z, armSway, 1.5 * dt)
      }
      if (rightArm) {
        const armSway = Math.sin(breathPhase.current * 0.35 + 3.5) * 0.01
        rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, -armSway, 1.5 * dt)
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
      case 'speaking':
        return 0.6
      case 'listening':
        return 0.4
      case 'thinking':
        return 0.3
      default:
        return 0.15
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
            ? `0 0 0 3px ${primaryColor}50, 0 0 30px ${primaryColor}${Math.floor(
                glowIntensity * 255
              )
                .toString(16)
                .padStart(2, '0')}, 0 0 60px ${primaryColor}20`
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
          {/* @ts-ignore R3F IntrinsicElements conflict */}
          <ambientLight intensity={0.6} />
          {/* @ts-ignore */}
          <directionalLight position={[1, 2, 3]} intensity={0.8} color="#ffffff" />
          {/* @ts-ignore */}
          <directionalLight position={[-1, 1, -1]} intensity={0.3} color="#b4c6e7" />

          {/* Rim light for depth — matches primary color */}
          {/* @ts-ignore */}
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
