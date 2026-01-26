/**
 * Tests de instanciación del widget standalone
 * Estos tests aseguran que las diferentes formas de inicializar el widget funcionen correctamente
 */

import { describe, it, expect, vi } from 'vitest';
import { BotUyoChatWidget } from '../../../standalone';

describe('Widget Instantiation - API Tests', () => {
  describe('Constructor', () => {
    it('debe crear una nueva instancia sin errores', () => {
      expect(() => new BotUyoChatWidget()).not.toThrow();
    });

    it('debe tener todos los métodos públicos', () => {
      const widget = new BotUyoChatWidget();
      
      expect(typeof widget.init).toBe('function');
      expect(typeof widget.update).toBe('function');
      expect(typeof widget.destroy).toBe('function');
      expect(typeof widget.open).toBe('function');
      expect(typeof widget.close).toBe('function');
      expect(typeof widget.sendMessage).toBe('function');
      expect(typeof widget.getState).toBe('function');
    });
  });

  describe('Temas Paseolibre - Configuraciones Reales', () => {
    it('debe aceptar BOTUYO_LIGHT_THEME sin errores', () => {
      const widget = new BotUyoChatWidget();
      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        theme: {
          primaryColor: 'hsl(210, 100%, 50%)',
          botName: 'Asistente Paseolibre',
          cssVariables: {
            background: '0 0% 100%',
            foreground: '210 20% 12%',
            primary: '210 100% 50%',
            radius: '0.75rem',
          },
        },
      };

      // Debe retornar la instancia (chaining)
      const result = widget.init(config);
      expect(result).toBe(widget);
    });

    it('debe aceptar BOTUYO_DARK_THEME sin errores', () => {
      const widget = new BotUyoChatWidget();
      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        theme: {
          primaryColor: 'hsl(210, 100%, 50%)',
          botName: 'Asistente Paseolibre',
          cssVariables: {
            background: '220 40% 3%',
            foreground: '210 20% 98%',
            primary: '210 100% 50%',
            radius: '0.75rem',
          },
        },
      };

      const result = widget.init(config);
      expect(result).toBe(widget);
    });
  });

  describe('Brand Variants - Configuraciones Reales', () => {
    const brandVariants = [
      { name: 'light', primary: '204 70% 63%', hsl: 'hsl(204, 70%, 63%)' },
      { name: 'medium', primary: '210 100% 50%', hsl: 'hsl(210, 100%, 50%)' },
      { name: 'dark', primary: '210 80% 45%', hsl: 'hsl(210, 80%, 45%)' },
      { name: 'darker', primary: '210 95% 35%', hsl: 'hsl(210, 95%, 35%)' },
    ];

    brandVariants.forEach(({ name, primary, hsl }) => {
      it(`debe aceptar brand variant ${name} sin errores`, () => {
        const widget = new BotUyoChatWidget();
        const config = {
          apiKey: 'test-key',
          apiBaseUrl: 'wss://test.com',
          theme: {
            primaryColor: hsl,
            cssVariables: {
              primary,
              radius: '0.75rem',
            },
          },
        };

        const result = widget.init(config);
        expect(result).toBe(widget);
      });
    });
  });

  describe('Temas Predefinidos', () => {
    const predefinedThemes = [
      { name: 'Default', primaryColor: 'hsl(160, 84%, 39%)' },
      { name: 'Corporate', primaryColor: 'hsl(221, 83%, 53%)' },
      { name: 'Minimalist', primaryColor: 'hsl(0, 0%, 9%)' },
      { name: 'WhatsApp', primaryColor: 'hsl(142, 70%, 49%)' },
      { name: 'Slack', primaryColor: 'hsl(211, 100%, 50%)' },
    ];

    predefinedThemes.forEach(({ name, primaryColor }) => {
      it(`debe aceptar tema ${name} sin errores`, () => {
        const widget = new BotUyoChatWidget();
        const config = {
          apiKey: 'test-key',
          apiBaseUrl: 'wss://test.com',
          theme: {
            primaryColor,
            botName: `${name} Bot`,
          },
        };

        const result = widget.init(config);
        expect(result).toBe(widget);
      });
    });
  });

  describe('Edge Cases - Casos Extremos', () => {
    it('debe aceptar configuración mínima', () => {
      const widget = new BotUyoChatWidget();
      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
      };

      const result = widget.init(config);
      expect(result).toBe(widget);
    });

    it('debe aceptar tema parcial', () => {
      const widget = new BotUyoChatWidget();
      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        theme: {
          primaryColor: 'hsl(210, 100%, 50%)',
        },
      };

      const result = widget.init(config);
      expect(result).toBe(widget);
    });

    it('debe aceptar solo cssVariables', () => {
      const widget = new BotUyoChatWidget();
      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        theme: {
          cssVariables: {
            primary: '210 100% 50%',
          },
        },
      };

      const result = widget.init(config);
      expect(result).toBe(widget);
    });

    it('debe aceptar callbacks opcionales', () => {
      const widget = new BotUyoChatWidget();
      const onNavigate = vi.fn();
      const onLogin = vi.fn();
      const onEvent = vi.fn();
      const onStateChange = vi.fn();

      const config = {
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        onNavigate,
        onLogin,
        onEvent,
        onStateChange,
      };

      const result = widget.init(config);
      expect(result).toBe(widget);
    });
  });

  describe('Método update()', () => {
    it('debe permitir actualizar tema después de init', () => {
      const widget = new BotUyoChatWidget();
      
      widget.init({
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
        theme: {
          primaryColor: 'hsl(160, 84%, 39%)',
        },
      });

      expect(() => {
        widget.update({
          theme: {
            primaryColor: 'hsl(210, 100%, 50%)',
          },
        });
      }).not.toThrow();
    });

    it('debe mostrar error si se llama update antes de init', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const widget = new BotUyoChatWidget();
      widget.update({
        theme: { primaryColor: 'hsl(210, 100%, 50%)' },
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[BotUyoChat] Widget not initialized');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Métodos de control', () => {
    it('debe tener método open()', () => {
      const widget = new BotUyoChatWidget();
      expect(typeof widget.open).toBe('function');
      expect(() => widget.open()).not.toThrow();
    });

    it('debe tener método close()', () => {
      const widget = new BotUyoChatWidget();
      expect(typeof widget.close).toBe('function');
      expect(() => widget.close()).not.toThrow();
    });

    it('debe tener método sendMessage()', () => {
      const widget = new BotUyoChatWidget();
      expect(typeof widget.sendMessage).toBe('function');
      expect(() => widget.sendMessage('Test message')).not.toThrow();
    });

    it('debe tener método getState()', () => {
      const widget = new BotUyoChatWidget();
      expect(typeof widget.getState).toBe('function');
      const state = widget.getState();
      // Por ahora retorna null hasta que se implemente state management
      expect(state).toBeNull();
    });

    it('debe tener método destroy()', () => {
      const widget = new BotUyoChatWidget();
      expect(typeof widget.destroy).toBe('function');
      expect(() => widget.destroy()).not.toThrow();
    });
  });

  describe('Múltiples Instancias', () => {
    it('debe permitir crear múltiples instancias', () => {
      const widget1 = new BotUyoChatWidget();
      const widget2 = new BotUyoChatWidget();
      const widget3 = new BotUyoChatWidget();

      expect(widget1).not.toBe(widget2);
      expect(widget2).not.toBe(widget3);
      expect(widget1).not.toBe(widget3);
    });

    it('todas las instancias deben ser independientes', () => {
      const widget1 = new BotUyoChatWidget();
      const widget2 = new BotUyoChatWidget();

      widget1.init({
        apiKey: 'key-1',
        apiBaseUrl: 'wss://test1.com',
      });

      widget2.init({
        apiKey: 'key-2',
        apiBaseUrl: 'wss://test2.com',
      });

      // Ambas instancias deben existir sin interferir entre sí
      expect(widget1).toBeTruthy();
      expect(widget2).toBeTruthy();
    });
  });

  describe('Chaining API', () => {
    it('init() debe retornar la instancia para chaining', () => {
      const widget = new BotUyoChatWidget();
      const result = widget.init({
        apiKey: 'test-key',
        apiBaseUrl: 'wss://test.com',
      });

      expect(result).toBe(widget);
    });

    it('debe permitir chaining de métodos', () => {
      const widget = new BotUyoChatWidget();
      
      expect(() => {
        widget
          .init({
            apiKey: 'test-key',
            apiBaseUrl: 'wss://test.com',
          })
          .open();
      }).not.toThrow();
    });
  });
});
