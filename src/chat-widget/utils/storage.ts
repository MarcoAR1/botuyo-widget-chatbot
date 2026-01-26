/**
 * @package @botuyo/chat-widget
 * Storage persistente con IndexedDB para chat offline-first
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { ChatMessage } from '../types'
import { logger } from '../utils/logger'

interface ChatDB extends DBSchema {
  messages: {
    key: string // message.id
    value: ChatMessage
    indexes: { 'by-timestamp': number }
  }
  metadata: {
    key: string
    value: any
  }
}

class ChatStorage {
  private db: IDBPDatabase<ChatDB> | null = null
  private readonly DB_NAME = 'botuyo-chat'
  private readonly DB_VERSION = 1

  async init() {
    try {
      this.db = await openDB<ChatDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Store de mensajes con índice por timestamp
          if (!db.objectStoreNames.contains('messages')) {
            const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
            messageStore.createIndex('by-timestamp', 'timestamp')
          }
          
          // Store de metadata (sessionId, configuración, etc.)
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata')
          }
        },
      })
      logger.info('IndexedDB initialized')
    } catch (error) {
      logger.error('Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  async saveMessage(message: ChatMessage) {
    if (!this.db) await this.init()
    try {
      await this.db!.put('messages', message)
    } catch (error) {
      logger.error('Failed to save message:', error)
    }
  }

  async saveMessages(messages: ChatMessage[]) {
    if (!this.db) await this.init()
    try {
      const tx = this.db!.transaction('messages', 'readwrite')
      await Promise.all([
        ...messages.map(msg => tx.store.put(msg)),
        tx.done,
      ])
    } catch (error) {
      logger.error('Failed to save messages:', error)
    }
  }

  async getMessages(limit = 100): Promise<ChatMessage[]> {
    if (!this.db) await this.init()
    try {
      const messages = await this.db!.getAllFromIndex(
        'messages',
        'by-timestamp'
      )
      return messages.slice(-limit) // Últimos N mensajes
    } catch (error) {
      logger.error('Failed to get messages:', error)
      return []
    }
  }

  async getMessage(id: string): Promise<ChatMessage | undefined> {
    if (!this.db) await this.init()
    try {
      return await this.db!.get('messages', id)
    } catch (error) {
      logger.error('Failed to get message:', error)
      return undefined
    }
  }

  async deleteMessage(id: string) {
    if (!this.db) await this.init()
    try {
      await this.db!.delete('messages', id)
    } catch (error) {
      logger.error('Failed to delete message:', error)
    }
  }

  async clearMessages() {
    if (!this.db) await this.init()
    try {
      await this.db!.clear('messages')
      logger.info('Messages cleared from IndexedDB')
    } catch (error) {
      logger.error('Failed to clear messages:', error)
    }
  }

  async setMetadata(data: any) {
    if (!this.db) await this.init()
    try {
      await this.db!.put('metadata', data, 'chat-metadata')
    } catch (error) {
      logger.error('Failed to set metadata:', error)
    }
  }

  async getMetadata(): Promise<any> {
    if (!this.db) await this.init()
    try {
      return await this.db!.get('metadata', 'chat-metadata')
    } catch (error) {
      logger.error('Failed to get metadata:', error)
      return null
    }
  }

  async clearAll() {
    if (!this.db) await this.init()
    try {
      await Promise.all([
        this.db!.clear('messages'),
        this.db!.clear('metadata'),
      ])
      logger.info('All data cleared from IndexedDB')
    } catch (error) {
      logger.error('Failed to clear all data:', error)
    }
  }

  // Método para migrar desde localStorage (compatibilidad)
  async migrateFromLocalStorage() {
    try {
      const STORAGE_KEY = 'botuyo_chat_v1'
      const saved = localStorage.getItem(STORAGE_KEY)
      
      if (!saved) return
      
      const parsed = JSON.parse(saved)
      
      // Migrar mensajes
      if (parsed.messages && Array.isArray(parsed.messages)) {
        const messages = parsed.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        await this.saveMessages(messages)
        logger.info(`Migrated ${messages.length} messages from localStorage`)
      }
      
      // Migrar sessionId
      if (parsed.sessionId) {
        await this.setMetadata({ sessionId: parsed.sessionId })
      }
      
      // Limpiar localStorage después de migración exitosa
      localStorage.removeItem(STORAGE_KEY)
      logger.info('Migration from localStorage completed')
    } catch (error) {
      logger.error('Failed to migrate from localStorage:', error)
    }
  }
}

// Singleton instance
export const chatStorage = new ChatStorage()
