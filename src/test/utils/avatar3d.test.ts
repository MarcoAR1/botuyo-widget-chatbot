/**
 * Pure 3D-avatar helpers — camera framing + idle-clip selection.
 *
 * These guard the reported bugs:
 *  - the voice-call avatar rendered "de espaldas" (camera on the wrong Z side)
 *  - the call not matching the (already-correct) preview framing
 *  - realistic GLB avatars "saltando" (every embedded clip auto-played)
 */

import { describe, it, expect } from 'vitest'
import { computeGlbFraming, selectIdleClip } from '@/chat-widget/utils/avatar3d'

describe('computeGlbFraming', () => {
  const size = { x: 0.6, y: 1.8, z: 0.4 }

  it('places the camera in FRONT of the model (+Z), never behind it', () => {
    // +Z is the glTF / Ready-Player-Me facing direction — the call used to use −Z
    // and rendered the back of the head ("de espaldas").
    expect(computeGlbFraming(size, 30).position[2]).toBeGreaterThan(0)
  })

  it('matches the original preview framing (targetY = 0.3·height, 1.2× pull-back)', () => {
    const f = computeGlbFraming({ x: 1, y: 2, z: 1 }, 30)
    const expectedDistance = ((2 * 0.5) / Math.tan((30 * Math.PI) / 180 / 2)) * 1.2
    expect(f.target[1]).toBeCloseTo(0.6, 5) // 0.3 * 2
    expect(f.position[1]).toBeCloseTo(0.6, 5)
    expect(f.position[2]).toBeCloseTo(expectedDistance, 5)
  })

  it('is deterministic, so the call and the preview frame the avatar identically', () => {
    // Avatar3D (call) and Avatar3DPreview pass the same size+fov here; the result
    // MUST be identical or they drift apart again (the original bug).
    expect(computeGlbFraming(size, 30)).toEqual(computeGlbFraming(size, 30))
  })

  it('keeps the look-at target level with the camera height and on the centre line', () => {
    const f = computeGlbFraming(size, 30)
    expect(f.target[1]).toBe(f.position[1])
    expect(f.target[0]).toBe(0)
    expect(f.target[2]).toBe(0)
  })

  it('scales the camera distance linearly with the model height', () => {
    const small = computeGlbFraming({ x: 1, y: 1, z: 1 }, 30)
    const big = computeGlbFraming({ x: 1, y: 2, z: 1 }, 30)
    expect(big.position[2]).toBeCloseTo(small.position[2] * 2, 5)
  })

  it('pulls the camera closer as the FOV widens', () => {
    const narrow = computeGlbFraming(size, 20)
    const wide = computeGlbFraming(size, 60)
    expect(wide.position[2]).toBeLessThan(narrow.position[2])
  })

  it('falls back to safe defaults instead of producing NaN/Infinity', () => {
    const f = computeGlbFraming({ x: 0, y: 0, z: 0 }, 0)
    expect(Number.isFinite(f.position[2])).toBe(true)
    expect(f.position[2]).toBeGreaterThan(0)
  })
})

describe('selectIdleClip', () => {
  it('returns null for an empty list', () => {
    expect(selectIdleClip([])).toBeNull()
  })

  it('returns null for a nullish list (defensive)', () => {
    expect(selectIdleClip(null as unknown as { name?: string }[])).toBeNull()
    expect(selectIdleClip(undefined as unknown as { name?: string }[])).toBeNull()
  })

  it('picks an idle-named clip, case-insensitively', () => {
    const clips = [{ name: 'Walk' }, { name: 'Idle' }, { name: 'Run' }]
    expect(selectIdleClip(clips)?.name).toBe('Idle')
  })

  it('matches breathing and relaxed idle variants', () => {
    expect(selectIdleClip([{ name: 'Breathing Idle' }])?.name).toBe('Breathing Idle')
    expect(selectIdleClip([{ name: 'relaxed' }])?.name).toBe('relaxed')
  })

  it('returns null when only locomotion/jump clips exist (prevents jumping)', () => {
    expect(selectIdleClip([{ name: 'Jump' }, { name: 'Run' }, { name: 'Walk' }])).toBeNull()
  })

  it('returns null for generically-named clips (e.g. Mixamo / Take 001)', () => {
    expect(selectIdleClip([{ name: 'mixamo.com' }, { name: 'Take 001' }])).toBeNull()
  })

  it('returns the first idle when several match', () => {
    const a = { name: 'Idle A' }
    const b = { name: 'Idle B' }
    expect(selectIdleClip([a, b])).toBe(a)
  })

  it('tolerates clips without a usable name', () => {
    expect(selectIdleClip([{}, { name: undefined }])).toBeNull()
  })
})
