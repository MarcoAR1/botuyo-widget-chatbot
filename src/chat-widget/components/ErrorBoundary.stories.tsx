import type { Meta, StoryObj } from '@storybook/react-vite'
import { ErrorBoundary } from './ErrorBoundary'
import { useState } from 'react'

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px', minHeight: '300px', padding: '20px', backgroundColor: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    onError: { action: 'error occurred' },
  },
} satisfies Meta<typeof ErrorBoundary>

export default meta
type Story = StoryObj<typeof meta>

// Componente que lanza un error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Este es un error de prueba')
  }
  return <div className="text-green-600 font-medium">✅ Todo funciona correctamente</div>
}

// Componente interactivo
function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Haz clic en el botón para simular un error:
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Lanzar Error
      </button>
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  )
}

export const Default: Story = {
  args: {
    children: (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-bold mb-2">Contenido Normal</h3>
        <p className="text-gray-600">
          Este componente está envuelto en un ErrorBoundary. Si ocurre un error,
          se mostrará un mensaje de fallback en lugar de romper toda la aplicación.
        </p>
      </div>
    ),
  },
  render: (args) => <ErrorBoundary {...args} />,
}

export const WithError: Story = {
  args: {
    children: <ThrowError shouldThrow={true} />,
  },
  render: (args) => <ErrorBoundary {...args} />,
}

export const CustomFallback: Story = {
  args: {
    children: <ThrowError shouldThrow={true} />,
    fallback: (
      <div className="p-8 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-center">
        <div className="text-4xl mb-3">🚨</div>
        <h3 className="text-lg font-bold text-yellow-900 mb-2">
          Error Personalizado
        </h3>
        <p className="text-sm text-yellow-700">
          Este es un mensaje de error personalizado
        </p>
      </div>
    ),
  },
  render: (args) => <ErrorBoundary {...args} />,
}

export const Interactive: Story = {
  args: {
    children: <div />,
  },
  render: () => <ErrorTrigger />,
}

export const NestedErrorBoundaries: Story = {
  args: {
    children: <div />,
  },
  render: () => (
    <div className="space-y-4">
      <ErrorBoundary>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-bold text-green-900 mb-2">Sección A - OK</h4>
          <p className="text-sm text-green-700">Esta sección funciona correctamente</p>
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-bold text-red-900 mb-2">Sección B - Error</h4>
          <ThrowError shouldThrow={true} />
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">Sección C - OK</h4>
          <p className="text-sm text-blue-700">
            Esta sección sigue funcionando a pesar del error en la Sección B
          </p>
        </div>
      </ErrorBoundary>
    </div>
  ),
}

export const WithErrorCallback: Story = {
  args: {
    children: <ThrowError shouldThrow={true} />,
    onError: (error, errorInfo) => {
      console.log('Error capturado:', error.message)
      console.log('Información del error:', errorInfo)
    },
  },
  render: (args) => <ErrorBoundary {...args} />,
}
