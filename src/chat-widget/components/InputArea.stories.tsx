import type { Meta, StoryObj } from '@storybook/react-vite'
import { InputArea } from './InputArea'

const meta = {
  title: 'Components/InputArea',
  component: InputArea,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    isConnected: {
      control: 'boolean',
      description: 'Whether the socket is connected',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary color for buttons',
    },
    mediaConfig: {
      control: 'object',
      description: 'Configuration for media uploads',
    },
    onSendMessage: { action: 'message sent' },
    onSendAttachment: { action: 'attachment sent' },
    onSendLocation: { action: 'location sent' },
  },
} satisfies Meta<typeof InputArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isConnected: true,
    placeholder: 'Escribe un mensaje...',
    primaryColor: '#10b981',
  },
}

export const Disconnected: Story = {
  args: {
    ...Default.args,
    isConnected: false,
  },
}

export const CustomPlaceholder: Story = {
  args: {
    ...Default.args,
    placeholder: 'Pregúntame lo que quieras...',
  },
}

export const CustomColor: Story = {
  args: {
    ...Default.args,
    primaryColor: '#3b82f6',
  },
}

export const AllMediaEnabled: Story = {
  args: {
    ...Default.args,
    mediaConfig: {
      enableImages: true,
      enableAudio: true,
      enableFiles: true,
      enableLocation: true,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      maxFileSizeMB: 10,
    },
  },
}

export const OnlyText: Story = {
  args: {
    ...Default.args,
    mediaConfig: {
      enableImages: false,
      enableAudio: false,
      enableFiles: false,
      enableLocation: false,
    },
  },
}

export const OnlyImages: Story = {
  args: {
    ...Default.args,
    mediaConfig: {
      enableImages: true,
      enableAudio: false,
      enableFiles: false,
      enableLocation: false,
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      maxFileSizeMB: 5,
    },
  },
}

export const ImagesAndLocation: Story = {
  args: {
    ...Default.args,
    mediaConfig: {
      enableImages: true,
      enableAudio: false,
      enableFiles: false,
      enableLocation: true,
      allowedFileTypes: ['jpg', 'jpeg', 'png'],
      maxFileSizeMB: 10,
    },
  },
}

export const SmallFileLimit: Story = {
  args: {
    ...Default.args,
    mediaConfig: {
      enableImages: true,
      enableAudio: true,
      enableFiles: true,
      enableLocation: true,
      allowedFileTypes: ['jpg', 'png', 'pdf'],
      maxFileSizeMB: 2,
    },
  },
}
