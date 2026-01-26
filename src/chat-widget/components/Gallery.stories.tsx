import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gallery } from './Gallery'

const meta = {
  title: 'Components/Gallery',
  component: Gallery,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <div style={{ width: '400px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    images: {
      control: 'object',
      description: 'Array of images to display',
    },
  },
} satisfies Meta<typeof Gallery>

export default meta
type Story = StoryObj<typeof meta>

export const SingleImage: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/800/600?random=1',
        alt: 'Imagen de ejemplo',
      },
    ],
  },
}

export const TwoImages: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/800/600?random=1',
        alt: 'Imagen 1',
      },
      {
        src: 'https://picsum.photos/800/600?random=2',
        alt: 'Imagen 2',
      },
    ],
  },
}

export const ThreeImages: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/800/600?random=1',
        alt: 'Imagen 1',
      },
      {
        src: 'https://picsum.photos/800/600?random=2',
        alt: 'Imagen 2',
      },
      {
        src: 'https://picsum.photos/800/600?random=3',
        alt: 'Imagen 3',
      },
    ],
  },
}

export const FourImages: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/800/600?random=1',
        alt: 'Imagen 1',
      },
      {
        src: 'https://picsum.photos/800/600?random=2',
        alt: 'Imagen 2',
      },
      {
        src: 'https://picsum.photos/800/600?random=3',
        alt: 'Imagen 3',
      },
      {
        src: 'https://picsum.photos/800/600?random=4',
        alt: 'Imagen 4',
      },
    ],
  },
}

export const ManyImages: Story = {
  args: {
    images: Array.from({ length: 8 }, (_, i) => ({
      src: `https://picsum.photos/800/600?random=${i + 1}`,
      alt: `Imagen ${i + 1}`,
    })),
  },
}

export const PortraitImages: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/600/800?random=1',
        alt: 'Retrato 1',
      },
      {
        src: 'https://picsum.photos/600/800?random=2',
        alt: 'Retrato 2',
      },
      {
        src: 'https://picsum.photos/600/800?random=3',
        alt: 'Retrato 3',
      },
    ],
  },
}

export const SquareImages: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/600/600?random=1',
        alt: 'Cuadrada 1',
      },
      {
        src: 'https://picsum.photos/600/600?random=2',
        alt: 'Cuadrada 2',
      },
      {
        src: 'https://picsum.photos/600/600?random=3',
        alt: 'Cuadrada 3',
      },
      {
        src: 'https://picsum.photos/600/600?random=4',
        alt: 'Cuadrada 4',
      },
    ],
  },
}

export const WithLongAltText: Story = {
  args: {
    images: [
      {
        src: 'https://picsum.photos/800/600?random=1',
        alt: 'Esta es una descripción muy larga de la imagen que incluye muchos detalles sobre lo que se puede ver en ella, como personas, objetos y el contexto general de la fotografía',
      },
    ],
  },
}
