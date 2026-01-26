/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_CSS_VARIABLES,
  DARK_CSS_VARIABLES,
  DEFAULT_THEME,
  OCEAN_THEME,
  SUNSET_THEME,
  mergeThemeWithDefaults,
  getPrimaryColor,
  cssVariablesToInlineStyles,
  getSolidStyles,
  type CSSVariables,
} from '../../chat-widget/utils/theme'

describe('theme', () => {
  describe('CSS Variables', () => {
    it('should have default CSS variables defined', () => {
      expect(DEFAULT_CSS_VARIABLES).toBeDefined()
      expect(DEFAULT_CSS_VARIABLES.background).toBe('0 0% 100%')
      expect(DEFAULT_CSS_VARIABLES.primary).toBe('160 84% 39%')
      expect(DEFAULT_CSS_VARIABLES.radius).toBe('0.5rem')
    })

    it('should have dark mode CSS variables defined', () => {
      expect(DARK_CSS_VARIABLES).toBeDefined()
      expect(DARK_CSS_VARIABLES.background).toBe('240 10% 3.9%')
      expect(DARK_CSS_VARIABLES.foreground).toBe('0 0% 98%')
    })

    it('should use same primary color in both light and dark themes', () => {
      expect(DEFAULT_CSS_VARIABLES.primary).toBe(DARK_CSS_VARIABLES.primary)
    })

    it('should have all required CSS variable properties', () => {
      const requiredProps: (keyof CSSVariables)[] = [
        'background',
        'foreground',
        'card',
        'cardForeground',
        'primary',
        'primaryForeground',
        'muted',
        'mutedForeground',
        'border',
        'destructive',
        'radius',
      ]

      requiredProps.forEach(prop => {
        expect(DEFAULT_CSS_VARIABLES[prop]).toBeDefined()
        expect(DARK_CSS_VARIABLES[prop]).toBeDefined()
      })
    })
  })

  describe('Predefined Themes', () => {
    describe('OCEAN_THEME', () => {
      it('should have ocean blue color', () => {
        expect(OCEAN_THEME.primaryColor).toBe('hsl(211, 100%, 50%)')
      })

      it('should have ocean branding', () => {
        expect(OCEAN_THEME.botName).toBe('Ocean Assistant')
      })
    })

    describe('SUNSET_THEME', () => {
      it('should have sunset orange color', () => {
        expect(SUNSET_THEME.primaryColor).toBe('hsl(24, 95%, 53%)')
      })

      it('should have sunset branding', () => {
        expect(SUNSET_THEME.botName).toBe('Sunset Helper')
      })
    })
  })

  describe('mergeThemeWithDefaults', () => {
    it('should return default theme when no user theme provided', () => {
      const merged = mergeThemeWithDefaults()
      
      expect(merged.primaryColor).toBe(DEFAULT_THEME.primaryColor)
      expect(merged.botName).toBe(DEFAULT_THEME.botName)
      expect(merged.cssVariables).toEqual(DEFAULT_CSS_VARIABLES)
    })

    it('should merge user theme with defaults', () => {
      const userTheme = {
        primaryColor: 'hsl(200, 100%, 50%)',
        botName: 'Custom Bot',
      }
      
      const merged = mergeThemeWithDefaults(userTheme)
      
      expect(merged.primaryColor).toBe('hsl(200, 100%, 50%)')
      expect(merged.botName).toBe('Custom Bot')
      expect(merged.position).toBe(DEFAULT_THEME.position) // Default
    })

    it('should merge CSS variables correctly', () => {
      const userTheme = {
        cssVariables: {
          primary: '200 100% 50%',
          radius: '1rem',
        },
      }
      
      const merged = mergeThemeWithDefaults(userTheme)
      
      expect(merged.cssVariables.primary).toBe('200 100% 50%')
      expect(merged.cssVariables.radius).toBe('1rem')
      expect(merged.cssVariables.background).toBe(DEFAULT_CSS_VARIABLES.background)
    })

    it('should handle partial CSS variables', () => {
      const userTheme = {
        cssVariables: {
          primary: '180 80% 40%',
        },
      }
      
      const merged = mergeThemeWithDefaults(userTheme)
      
      expect(merged.cssVariables.primary).toBe('180 80% 40%')
      expect(merged.cssVariables.foreground).toBe(DEFAULT_CSS_VARIABLES.foreground)
    })

    it('should override all default values when provided', () => {
      const userTheme = {
        primaryColor: 'hsl(0, 100%, 50%)',
        botName: 'New Bot',
        logoUrl: 'https://example.com/logo.png',
        position: 'bottom-left' as const,
        welcomeMessage: 'Custom welcome',
        inputPlaceholder: 'Custom placeholder',
      }
      
      const merged = mergeThemeWithDefaults(userTheme)
      
      expect(merged.primaryColor).toBe(userTheme.primaryColor)
      expect(merged.botName).toBe(userTheme.botName)
      expect(merged.logoUrl).toBe(userTheme.logoUrl)
      expect(merged.position).toBe(userTheme.position)
      expect(merged.welcomeMessage).toBe(userTheme.welcomeMessage)
      expect(merged.inputPlaceholder).toBe(userTheme.inputPlaceholder)
    })
  })

  describe('getPrimaryColor', () => {
    it('should return provided primary color', () => {
      const color = getPrimaryColor({ primaryColor: 'hsl(200, 50%, 50%)' })
      
      expect(color).toBe('hsl(200, 50%, 50%)')
    })

    it('should return default color when not provided', () => {
      const color = getPrimaryColor({})
      
      expect(color).toBe('hsl(160, 84%, 39%)')
    })

    it('should handle undefined primaryColor', () => {
      const color = getPrimaryColor({ primaryColor: undefined })
      
      expect(color).toBe('hsl(160, 84%, 39%)')
    })
  })

  describe('cssVariablesToInlineStyles', () => {
    it('should convert CSS variables to inline styles', () => {
      const styles = cssVariablesToInlineStyles({})
      
      expect(styles['--background']).toBe(DEFAULT_CSS_VARIABLES.background)
      expect(styles['--primary']).toBe(DEFAULT_CSS_VARIABLES.primary)
      expect(styles['--radius']).toBe(DEFAULT_CSS_VARIABLES.radius)
    })

    it('should use custom variables when provided', () => {
      const customVars = {
        primary: '200 100% 50%',
        radius: '2rem',
      }
      
      const styles = cssVariablesToInlineStyles(customVars)
      
      expect(styles['--primary']).toBe('200 100% 50%')
      expect(styles['--radius']).toBe('2rem')
      expect(styles['--background']).toBe(DEFAULT_CSS_VARIABLES.background)
    })

    it('should convert all CSS variable properties', () => {
      const styles = cssVariablesToInlineStyles({})
      
      expect(styles).toHaveProperty('--background')
      expect(styles).toHaveProperty('--foreground')
      expect(styles).toHaveProperty('--card')
      expect(styles).toHaveProperty('--card-foreground')
      expect(styles).toHaveProperty('--primary')
      expect(styles).toHaveProperty('--primary-foreground')
      expect(styles).toHaveProperty('--muted')
      expect(styles).toHaveProperty('--muted-foreground')
      expect(styles).toHaveProperty('--border')
      expect(styles).toHaveProperty('--destructive')
      expect(styles).toHaveProperty('--radius')
    })

    it('should handle kebab-case conversion', () => {
      const styles = cssVariablesToInlineStyles({})
      
      // cardForeground -> card-foreground
      expect(styles['--card-foreground']).toBe(DEFAULT_CSS_VARIABLES.cardForeground)
      expect(styles['--primary-foreground']).toBe(DEFAULT_CSS_VARIABLES.primaryForeground)
      expect(styles['--muted-foreground']).toBe(DEFAULT_CSS_VARIABLES.mutedForeground)
    })
  })

  describe('getSolidStyles', () => {
    it('should convert HSL variables to solid colors', () => {
      const styles = getSolidStyles()
      
      expect(styles.background).toBe(`hsl(${DEFAULT_CSS_VARIABLES.background})`)
      expect(styles.primary).toBe(`hsl(${DEFAULT_CSS_VARIABLES.primary})`)
    })

    it('should use custom variables when provided', () => {
      const customVars = {
        primary: '200 100% 50%',
        background: '0 0% 95%',
      }
      
      const styles = getSolidStyles(customVars)
      
      expect(styles.primary).toBe('hsl(200 100% 50%)')
      expect(styles.background).toBe('hsl(0 0% 95%)')
    })

    it('should return all color properties', () => {
      const styles = getSolidStyles()
      
      expect(styles).toHaveProperty('background')
      expect(styles).toHaveProperty('foreground')
      expect(styles).toHaveProperty('card')
      expect(styles).toHaveProperty('cardForeground')
      expect(styles).toHaveProperty('primary')
      expect(styles).toHaveProperty('primaryForeground')
      expect(styles).toHaveProperty('muted')
      expect(styles).toHaveProperty('mutedForeground')
      expect(styles).toHaveProperty('border')
      expect(styles).toHaveProperty('destructive')
    })

    it('should create valid CSS color values', () => {
      const styles = getSolidStyles()
      
      // Verificar que todos los valores empiezan con 'hsl('
      Object.values(styles).forEach(value => {
        expect(value).toMatch(/^hsl\(.+\)$/)
      })
    })
  })

  describe('Theme Consistency', () => {
    it('all themes should have required properties', () => {
      const themes = [
        DEFAULT_THEME,
        OCEAN_THEME,
        SUNSET_THEME,
      ]

      themes.forEach(theme => {
        expect(theme.primaryColor).toBeDefined()
        expect(theme.botName).toBeDefined()
        // position, welcomeMessage, inputPlaceholder are optional in ChatTheme
        if (theme.cssVariables) {
          expect(theme.cssVariables).toBeDefined()
        }
      })
    })

    it('all themes should have valid position values', () => {
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
      const themes = [
        DEFAULT_THEME,
        OCEAN_THEME,
        SUNSET_THEME,
      ]

      themes.forEach(theme => {
        // position is optional
        if (theme.position) {
          expect(validPositions).toContain(theme.position)
        }
      })
    })

    it('all themes should have valid HSL color formats', () => {
      const themes = [
        DEFAULT_THEME,
        OCEAN_THEME,
        SUNSET_THEME,
      ]

      themes.forEach(theme => {
        expect(theme.primaryColor).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
      })
    })
  })
})
