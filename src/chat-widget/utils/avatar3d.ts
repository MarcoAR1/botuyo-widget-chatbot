/**
 * Pure 3D-avatar helpers shared by the voice-call avatar (`Avatar3D`) and the
 * dashboard previewer (`Avatar3DPreview`).
 *
 * Keeping the camera framing + animation selection here (instead of duplicated
 * inside each component) guarantees the two stay in sync — historically they
 * drifted apart and the call ended up rendering the avatar from behind while the
 * preview rendered it from the front.
 *
 * No three.js / R3F imports on purpose: this is plain math so it is trivially
 * unit-testable in happy-dom without mocking the WebGL stack.
 */

export type AvatarFramingMode = 'bust' | 'portrait'

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

/**
 * Per-mode framing tuning.
 * - `targetYFactor` — look-at height as a fraction of the model height (0 = bbox centre, +0.5 = top).
 * - `spanFactor`    — fraction of the model height that should fill the vertical FOV (>1 = breathing room).
 */
const FRAMING: Record<AvatarFramingMode, { targetYFactor: number; spanFactor: number }> = {
  // Head, shoulders and upper chest — fits the small voice-call orb.
  bust: { targetYFactor: 0.28, spanFactor: 0.6 },
  // Whole figure with margin — so the preview gallery shows the full avatar (outfit included),
  // instead of a cropped, over-zoomed close-up.
  portrait: { targetYFactor: 0, spanFactor: 1.35 },
}

const DEFAULT_FOV_DEGREES = 30

/**
 * Compute where to place the camera to frame a centred GLB avatar.
 *
 * The model is expected to already be centred on the origin (its bbox centre at
 * `(0,0,0)`), so it spans `[-size.y/2, +size.y/2]` vertically. The camera is
 * placed on the **positive Z axis** because glTF / Ready-Player-Me humanoids
 * face +Z — this is what stops the avatar from appearing "de espaldas".
 */
export function computeGlbFraming(
  size: AvatarSize,
  fovDegrees: number,
  mode: AvatarFramingMode
): AvatarFraming {
  const height = size.y > 0 ? size.y : 1
  const fov = ((fovDegrees > 0 ? fovDegrees : DEFAULT_FOV_DEGREES) * Math.PI) / 180
  const { targetYFactor, spanFactor } = FRAMING[mode]

  const targetY = height * targetYFactor
  // Distance at which `height * spanFactor` exactly fills the vertical FOV.
  const distance = (height * spanFactor * 0.5) / Math.tan(fov / 2)

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
