/**
 * @package @botuyo/chat-widget
 * Avatar3DPreview — lightweight 3D avatar previewer (dashboard/landing consumer).
 *
 * The 3D scene itself (R3F + three) is mocked: these tests cover the presentational
 * shell — loading overlay, error overlay, empty guard, container styling, and the
 * onLoad/onError callbacks driven by the model loader.
 */

import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

// ── Mock the GLTF loader: success unless the url contains "fail" ──
const loadImpl = vi.fn()
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class {
    register() {}
    load(url: string, onLoad: (g: unknown) => void, _p: unknown, onError: (e: unknown) => void) {
      loadImpl(url, onLoad, onError)
    }
  },
}))
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: class {
    enableZoom = true
    enablePan = true
    autoRotate = false
    update() {}
    dispose() {}
  },
}))
vi.mock('@pixiv/three-vrm', () => ({
  VRMLoaderPlugin: class {},
  VRM: class {},
}))
vi.mock('three', () => ({
  Box3: class {
    setFromObject() {
      return this
    }
    getSize(v: { set: (x: number, y: number, z: number) => void }) {
      v.set(1, 1, 1)
      return v
    }
    getCenter(v: { set: (x: number, y: number, z: number) => void }) {
      v.set(0, 0, 0)
      return v
    }
  },
  Vector3: class {
    set() {
      return this
    }
  },
  Group: class {
    add() {}
    position = { sub: () => {}, set: () => {} }
    rotation = {}
  },
  AnimationMixer: class {
    clipAction() {
      return { play: () => {} }
    }
    update() {}
    stopAllAction() {}
  },
  MathUtils: { lerp: (a: number) => a },
}))

// ── Mock R3F: Canvas renders children so the inner model effect runs ──
// NOTE: useThree must return STABLE references (like the real R3F store) — returning
// fresh objects each render would re-trigger the load effect and loop forever.
const r3fStore = {
  scene: { add: () => {}, remove: () => {} },
  camera: { position: { set: () => {} }, lookAt: () => {}, fov: 30 },
  gl: { domElement: document.createElement('canvas') },
}
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: () => r3fStore,
  useFrame: () => {},
}))

import { Avatar3DPreview } from '@/chat-widget/components/Avatar3DPreview'

beforeEach(() => {
  loadImpl.mockReset()
  // default: succeed immediately as a plain GLB
  loadImpl.mockImplementation((_url: string, onLoad: (g: unknown) => void) => {
    onLoad({
      scene: { updateMatrixWorld: () => {}, traverse: () => {}, position: { sub: () => {} } },
      animations: [],
    })
  })
})

describe('Avatar3DPreview', () => {
  it('renders nothing when url is empty', () => {
    const { container } = render(<Avatar3DPreview url="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a loading overlay before the model resolves', () => {
    loadImpl.mockImplementation(() => {
      /* never call onLoad → stays loading */
    })
    render(<Avatar3DPreview url="https://cdn/model.glb" loadingLabel="Cargando…" />)
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })

  it('hides the loading overlay once the model loads', () => {
    render(<Avatar3DPreview url="https://cdn/model.glb" loadingLabel="Cargando…" />)
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
  })

  it('fires onLoad when the model resolves', () => {
    const onLoad = vi.fn()
    render(<Avatar3DPreview url="https://cdn/model.glb" onLoad={onLoad} />)
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('shows an error overlay and fires onError when the model fails', () => {
    loadImpl.mockImplementation((_u: string, _ok: unknown, onError: (e: unknown) => void) => {
      onError(new Error('boom'))
    })
    const onError = vi.fn()
    render(<Avatar3DPreview url="https://cdn/bad.glb" errorLabel="No se pudo cargar" onError={onError} />)
    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('applies a custom className to the container', () => {
    const { container } = render(<Avatar3DPreview url="https://cdn/model.glb" className="my-cls" />)
    expect(container.firstChild).toHaveClass('my-cls')
  })

  it('renders the R3F canvas when a url is provided', () => {
    render(<Avatar3DPreview url="https://cdn/model.glb" />)
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument()
  })

  it('reloads (returns to loading) when the url changes to a never-resolving model', () => {
    const { rerender } = render(<Avatar3DPreview url="https://cdn/a.glb" loadingLabel="Cargando…" />)
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
    loadImpl.mockImplementation(() => {})
    rerender(<Avatar3DPreview url="https://cdn/b.glb" loadingLabel="Cargando…" />)
    expect(screen.getByText('Cargando…')).toBeInTheDocument()
  })
})
