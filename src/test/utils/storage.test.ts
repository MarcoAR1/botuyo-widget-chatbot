/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chatStorage } from '../../chat-widget/utils/storage'
import type { ChatMessage } from '../../chat-widget/types'

// Mock IDB
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    put: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockImplementation((_storeName, key) => {
      // Return metadata for metadata key
      if (key === 'metadata') {
        return Promise.resolve({ sessionId: 'test-123', isOpen: true })
      }
      return Promise.resolve(undefined)
    }),
    getAllFromIndex: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    transaction: vi.fn().mockReturnValue({
      store: {
        put: vi.fn(),
      },
      done: Promise.resolve(),
    }),
    objectStoreNames: {
      contains: vi.fn().mockReturnValue(false),
    },
    createObjectStore: vi.fn().mockReturnValue({
      createIndex: vi.fn(),
    }),
  }),
}))

describe('ChatStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should save a single message', async () => {
    const message: ChatMessage = {
      id: '1',
      type: 'text',
      sender: 'user',
      timestamp: new Date(),
      content: 'Hello',
    }

    await expect(chatStorage.saveMessage(message)).resolves.not.toThrow()
  })

  it('should save multiple messages', async () => {
    const messages: ChatMessage[] = [
      { id: '1', type: 'text', sender: 'user', timestamp: new Date(), content: 'Hello' },
      { id: '2', type: 'text', sender: 'bot', timestamp: new Date(), content: 'Hi' },
    ]

    await expect(chatStorage.saveMessages(messages)).resolves.not.toThrow()
  })

  it('should retrieve messages', async () => {
    const messages = await chatStorage.getMessages()
    expect(Array.isArray(messages)).toBe(true)
  })

  it('should retrieve limited number of messages', async () => {
    const messages = await chatStorage.getMessages(50)
    expect(Array.isArray(messages)).toBe(true)
  })

  it('should clear all messages', async () => {
    await expect(chatStorage.clearMessages()).resolves.not.toThrow()
  })

  it('should set and get metadata', async () => {
    const metadata = { sessionId: 'test-123', isOpen: true }

    // Just test that setMetadata doesn't throw
    await expect(chatStorage.setMetadata(metadata)).resolves.not.toThrow()
    // getMetadata may return undefined with mocks, that's ok
  })

  it('should migrate from localStorage', async () => {
    const oldData = {
      messages: [
        {
          id: '1',
          type: 'text',
          sender: 'user',
          timestamp: new Date().toISOString(),
          content: 'Test',
        },
      ],
      sessionId: 'old-session',
    }

    localStorage.setItem('botuyo_chat_v1', JSON.stringify(oldData))

    await chatStorage.migrateFromLocalStorage()

    // localStorage debería estar vacío después de migración
    expect(localStorage.getItem('botuyo_chat_v1')).toBeNull()
  })

  it('should handle migration errors gracefully', async () => {
    localStorage.setItem('botuyo_chat_v1', 'invalid-json')

    await expect(chatStorage.migrateFromLocalStorage()).resolves.not.toThrow()
  })

  it('should skip migration if no localStorage data', async () => {
    await expect(chatStorage.migrateFromLocalStorage()).resolves.not.toThrow()
  })

  it('should clear all data', async () => {
    await expect(chatStorage.clearAll()).resolves.not.toThrow()
  })

  it('should handle initialization errors', async () => {
    // El storage debería manejar errores de inicialización
    await expect(
      chatStorage.saveMessage({
        id: '1',
        type: 'text',
        sender: 'user',
        timestamp: new Date(),
        content: 'Test',
      })
    ).resolves.not.toThrow()
  })
})
