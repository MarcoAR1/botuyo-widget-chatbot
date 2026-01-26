import type { Meta, StoryObj } from '@storybook/react-vite'
import { AudioPlayer } from './AudioPlayer'

const meta = {
  title: 'Components/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'URL of the audio file',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary color for the player controls',
    },
  },
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    src: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    primaryColor: '#10b981',
  },
}

export const CustomColor: Story = {
  args: {
    src: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    primaryColor: '#3b82f6',
  },
}

export const PurpleTheme: Story = {
  args: {
    src: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    primaryColor: '#8b5cf6',
  },
}

export const RedTheme: Story = {
  args: {
    src: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
    primaryColor: '#ef4444',
  },
}

export const MultipleAudioPlayers: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-2">Audio 1 - Verde</p>
        <AudioPlayer
          src="https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"
          primaryColor="#10b981"
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">Audio 2 - Azul</p>
        <AudioPlayer
          src="https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"
          primaryColor="#3b82f6"
        />
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">Audio 3 - Púrpura</p>
        <AudioPlayer
          src="https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav"
          primaryColor="#8b5cf6"
        />
      </div>
    </div>
  ),
}

export const InvalidAudio: Story = {
  args: {
    src: 'https://invalid-url-that-does-not-exist.com/audio.mp3',
    primaryColor: '#10b981',
  },
}
