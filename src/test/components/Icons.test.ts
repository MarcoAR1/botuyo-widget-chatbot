/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import * as Icons from '@/chat-widget/components/Icons'

describe('Icons', () => {
  describe('Icon Exports', () => {
    it('should export ChatWindow icons', () => {
      expect(Icons.X).toBeDefined()
      expect(Icons.ShieldCheck).toBeDefined()
      expect(Icons.Heart).toBeDefined()
    })

    it('should export InputArea icons', () => {
      expect(Icons.Paperclip).toBeDefined()
      expect(Icons.Send).toBeDefined()
      expect(Icons.Loader2).toBeDefined()
      expect(Icons.ImageIcon).toBeDefined()
      expect(Icons.FileAudio).toBeDefined()
      expect(Icons.FileText).toBeDefined()
      expect(Icons.FileIcon).toBeDefined()
      expect(Icons.Plus).toBeDefined()
      expect(Icons.MapPin).toBeDefined()
      expect(Icons.Mic).toBeDefined()
      expect(Icons.Trash2).toBeDefined()
    })

    it('should export AudioPlayer icons', () => {
      expect(Icons.Play).toBeDefined()
      expect(Icons.Pause).toBeDefined()
    })

    it('should export Launcher icons', () => {
      expect(Icons.MessageCircle).toBeDefined()
    })

    it('should export Gallery icons', () => {
      expect(Icons.ChevronLeft).toBeDefined()
      expect(Icons.ChevronRight).toBeDefined()
      expect(Icons.ZoomIn).toBeDefined()
    })

    it('should export MessageBubble icons', () => {
      expect(Icons.CheckCheck).toBeDefined()
      expect(Icons.MapPinBubble).toBeDefined()
      expect(Icons.ExternalLink).toBeDefined()
      expect(Icons.ArrowRight).toBeDefined()
      expect(Icons.Download).toBeDefined()
    })

    it('should export all icons as objects (React components)', () => {
      const iconNames = [
        'X', 'ShieldCheck', 'Heart',
        'Paperclip', 'Send', 'Loader2', 'ImageIcon', 'FileAudio', 'FileText',
        'FileIcon', 'Plus', 'MapPin', 'Mic', 'Trash2',
        'Play', 'Pause',
        'MessageCircle',
        'ChevronLeft', 'ChevronRight', 'ZoomIn',
        'CheckCheck', 'MapPinBubble', 'ExternalLink', 'ArrowRight', 'Download',
      ]

      iconNames.forEach(iconName => {
        const icon = (Icons as any)[iconName]
        // React components are objects with ForwardRef
        expect(icon).toBeDefined()
        expect(typeof icon).toBe('object')
      })
    })

    it('should have unique exports for MapPin and MapPinBubble', () => {
      // Both should reference the same icon but with different names
      expect(Icons.MapPin).toBeDefined()
      expect(Icons.MapPinBubble).toBeDefined()
      expect(Icons.MapPin).toBe(Icons.MapPinBubble)
    })

    it('should export 25 unique icon references', () => {
      const exportedKeys = Object.keys(Icons)
      expect(exportedKeys.length).toBe(25)
    })
  })

  describe('Icon Types', () => {
    it('should be valid React components', () => {
      // All lucide-react icons are ForwardRef components
      expect(Icons.X.$$typeof).toBeDefined()
      expect(Icons.Send.$$typeof).toBeDefined()
      expect(Icons.MessageCircle.$$typeof).toBeDefined()
    })
  })

  describe('Bundle Optimization', () => {
    it('should allow tree-shaking by using named exports', () => {
      // This test verifies that we're using named exports
      // which enables tree-shaking
      const keys = Object.keys(Icons)
      expect(keys.length).toBeGreaterThan(0)
      
      // Verify no default export
      expect((Icons as any).default).toBeUndefined()
    })
  })
})
