/**
 * Pure 3D-avatar helpers — camera framing + idle-clip selection.
 *
 * These guard the two reported bugs:
 *  - the voice-call avatar rendered "de espaldas" (camera on the wrong Z side)
 *  - realistic GLB avatars "saltando" (every embedded clip auto-played)
 *  - the preview gallery being too zoomed-in (legs/outfit cropped)
 */

import { describe, it, expect } from 'vitest'
import { computeGlbFraming, selectIdleClip } from '@/chat-widget/utils/avatar3d'

describe('computeGlbFraming', () => {
  const size = { x: 0.6, y: 1.8, z: 0.4 }

  it('places the camera in FRONT of the model (+Z) for the voice-call bust', () => {
    // +Z is the glTF / Ready-Player-Me facing direction — never render the back.
    expect(computeGlbFraming(size, 30, 'bust').position[2]).toBeGreaterThan(0)
  })

  it('places the camera in FRONT of the model (+Z) for the preview portrait', () => {
    expect(computeGlbFraming(size, 30, 'portrait').position[2]).toBeGreaterThan(0)
  })

  it('frames the portrait farther back than the bust (whole avatar visible, not over-zoomed)', () => {
    const bust = computeGlbFraming(size, 30, 'bust')
    const portrait = computeGlbFraming(size, 30, 'portrait')
    expect(portrait.position[2]).toBeGreaterThan(bust.position[2])
  })

  it('targets the upper body for the bust and the centre for the portrait', () => {
    expect(computeGlbFraming(size, 30, 'bust').target[1]).toBeGreaterThan(0)
    expect(computeGlbFraming(size, 30, 'portrait').target[1]).toBe(0)
  })

  it('keeps the look-at target level with the camera height and on the centre line', () => {
    const f = computeGlbFraming(size, 30, 'bust')
    expect(f.target[1]).toBe(f.position[1])
    expect(f.target[0]).toBe(0)
    expect(f.target[2]).toBe(0)
  })

  it('scales the camera distance linearly with the model height', () => {
    const small = computeGlbFraming({ x: 1, y: 1, z: 1 }, 30, 'portrait')
    const big = computeGlbFraming({ x: 1, y: 2, z: 1 }, 30, 'portrait')
    expect(big.position[2]).toBeCloseTo(small.position[2] * 2, 5)
  })

  it('pulls the camera closer as the FOV widens', () => {
    const narrow = computeGlbFraming(size, 20, 'portrait')
    const wide = computeGlbFraming(size, 60, 'portrait')
    expect(wide.position[2]).toBeLessThan(narrow.position[2])
  })

  it('falls back to safe defaults instead of producing NaN/Infinity', () => {
    const f = computeGlbFraming({ x: 0, y: 0, z: 0 }, 0, 'bust')
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
