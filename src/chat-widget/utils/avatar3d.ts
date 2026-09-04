/**
 * Pure 3D-avatar helpers shared by the voice-call avatar (`Avatar3D`) and the
 * dashboard/landing previewer (`Avatar3DPreview`).
 *
 * The preview framing was already correct, so it is the single source of truth:
 * both the call and the preview place the camera with `computeGlbFraming`, which
 * guarantees the call shows exactly what the preview shows — same distance, same
 * front-facing orientation — instead of the two drifting apart (the call used to
 * render the avatar from behind, "de espaldas").
 *
 * No three.js / R3F imports on purpose: this is plain math so it is trivially
 * unit-testable in happy-dom without mocking the WebGL stack.
 */

/** Bounding-box size (metres) of the model AFTER it has been centred on the origin. */
export interface AvatarSize {
  x: number
  y: number
  z: number
}

export interface AvatarFraming {
  /** Camera position `[x, y, z]`. Always on **+Z** (glTF / Ready-Player-Me avatars face +Z). */
  position: [number, number, number]
  /** Look-at / orbit target `[x, y, z]`, kept level with the camera height. */
  target: [number, number, number]
}

const DEFAULT_FOV_DEGREES = 30
/** Look-at height as a fraction of the model height (0 = bbox centre, +0.5 = top of head). */
const TARGET_Y_FACTOR = 0.3
/** Pull the camera back this much past the exact fit, so the figure has breathing room. */
const DISTANCE_PADDING = 1.2

/**
 * Compute where to place the camera to frame a centred GLB avatar.
 *
 * The model is expected to already be centred on the origin (its bbox centre at
 * `(0,0,0)`), so it spans `[-size.y/2, +size.y/2]` vertically. The camera is
 * placed on the **positive Z axis** because glTF / Ready-Player-Me humanoids
 * face +Z — this is what stops the avatar from appearing "de espaldas".
 *
 * The numbers mirror the preview's original (correct) framing, so the voice call
 * and the preview render the avatar identically.
 */
/** Optional framing tweaks so the face is always visible and consumers can fine-tune. */
export interface FramingOptions {
  /** Fraction of the model height to fit vertically. `1` = full figure, `~0.55` ≈ bust. Default `1`. */
  portion?: number
  /** Look-at height as a fraction of the model height. Default `0.3`. */
  targetYFactor?: number
  /** Zoom multiplier (`>1` = closer, `<1` = farther). Default `1`. */
  zoom?: number
  /** Vertical nudge added to the look-at target, in metres. Default `0`. */
  offsetY?: number
}

export function computeGlbFraming(
  size: AvatarSize,
  fovDegrees: number,
  opts: FramingOptions = {}
): AvatarFraming {
  const height = size.y > 0 ? size.y : 1
  const fov = ((fovDegrees > 0 ? fovDegrees : DEFAULT_FOV_DEGREES) * Math.PI) / 180

  const portion = opts.portion && opts.portion > 0 ? opts.portion : 1
  const zoom = opts.zoom && opts.zoom > 0 ? opts.zoom : 1
  const targetYFactor = opts.targetYFactor ?? TARGET_Y_FACTOR
  const offsetY = opts.offsetY ?? 0

  const targetY = height * targetYFactor + offsetY
  // Distance that fits `height * portion` in the vertical FOV, with padding, divided by zoom.
  const distance = (((height * portion) * 0.5) / Math.tan(fov / 2)) * DISTANCE_PADDING / zoom

  return {
    position: [0, targetY, distance],
    target: [0, targetY, 0],
  }
}

/** Animation clips whose name clearly marks them as a stationary idle loop. */
const IDLE_NAME_PATTERN = /idle|breath|relax/i

/**
 * Pick the single idle animation clip to auto-play, or `null`.
 *
 * Avatars in a chat/voice context should stay put — they are talking heads, not
 * game characters. Auto-playing *every* embedded clip (or a locomotion/jump
 * clip) makes the model jump, walk or T-pose inside the frame. So we only play a
 * clip that is explicitly named like an idle loop; anything else (jump, run,
 * walk, generic "mixamo.com" / "Take 001" names) is skipped in favour of the
 * component's procedural breathing/sway.
 */
export function selectIdleClip<T extends { name?: string | null }>(clips: readonly T[]): T | null {
  if (!clips || clips.length === 0) return null
  for (const clip of clips) {
    if (clip && IDLE_NAME_PATTERN.test(clip.name ?? '')) return clip
  }
  return null
}
