import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar3DPreview } from './Avatar3DPreview'

/**
 * Avatar3DPreview is a lightweight, interactive 3D avatar previewer (no voice-call
 * pipeline). Drag to orbit, scroll/pinch to zoom, and it shows loading + error
 * states. Used by consumer apps (dashboard/landing) to preview interviewer avatars.
 *
 * The sample below points at a public Ready Player Me GLB; swap the `url` control
 * for any `.glb` / `.vrm` model.
 */
const SAMPLE_MODEL = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb'

const meta = {
  title: 'ChatWidget/Avatar3DPreview',
  component: Avatar3DPreview,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    url: { control: 'text', description: 'URL to a .glb / .vrm model' },
    interactive: { control: 'boolean', description: 'Allow orbit + zoom' },
    autoRotate: { control: 'boolean', description: 'Slow idle auto-spin' },
    showShadow: { control: 'boolean', description: 'Soft contact shadow' },
    loadingLabel: { control: 'text' },
    errorLabel: { control: 'text' },
  },
  decorators: [
    Story => (
      <div
        style={{
          width: '280px',
          height: '340px',
          borderRadius: '16px',
          background: 'linear-gradient(160deg, #eef2ff 0%, #e0e7ef 100%)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Avatar3DPreview>

export default meta
type Story = StoryObj<typeof meta>

/** Interactive preview (orbit + zoom + auto-spin) with a soft contact shadow. */
export const Default: Story = {
  args: {
    url: SAMPLE_MODEL,
    interactive: true,
    autoRotate: true,
    showShadow: true,
  },
}

/** Static framed shot — no user interaction, model self-spins. */
export const NonInteractive: Story = {
  args: {
    url: SAMPLE_MODEL,
    interactive: false,
    autoRotate: true,
    showShadow: true,
  },
}

/** Error state: an unreachable model surfaces the localized error overlay. */
export const ErrorState: Story = {
  args: {
    url: 'https://invalid.example/not-a-real-model.glb',
    errorLabel: 'No se pudo cargar el avatar 3D',
  },
}

/** Custom localized loading + error copy. */
export const CustomLabels: Story = {
  args: {
    url: SAMPLE_MODEL,
    loadingLabel: 'Cargando avatar…',
    errorLabel: 'No se pudo cargar el avatar 3D',
  },
}
