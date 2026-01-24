/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import {
  defaultTheme,
  // darkTheme,
  // corporateTheme,
  // minimalistTheme,
  customSimpleTheme,
  customFullTheme,
  // extendedTheme,
  // monochromeTheme,
  // whatsAppTheme,
  // slackTheme,
  mergedTheme,
  myComponent,
  containerStyle,
  MyApp,
} from '@/chat-widget/utils/theme.examples'

describe('theme.examples', () => {
  describe('Predefined Themes', () => {
    it('should export defaultTheme', () => {
      expect(defaultTheme).toBeDefined()
      expect(defaultTheme.primaryColor).toBe('hsl(160, 84%, 39%)')
      expect(defaultTheme.botName).toBe('Asistente')
      expect(defaultTheme.cssVariables).toBeDefined()
    })

    // it('should export darkTheme', () => {
    //   expect(darkTheme).toBeDefined()
    //   expect(darkTheme.cssVariables).toBeDefined()
    // })

    // it('should export corporateTheme', () => {
    //   expect(corporateTheme).toBeDefined()
    //   expect(corporateTheme.cssVariables).toBeDefined()
    // })

    // it('should export minimalistTheme', () => {
    //   expect(minimalistTheme).toBeDefined()
    //   expect(minimalistTheme.cssVariables).toBeDefined()
    // })
  })

  describe('Custom Simple Theme', () => {
    it('should have custom primary color', () => {
      expect(customSimpleTheme.primaryColor).toBe('hsl(280, 100%, 50%)')
      expect(customSimpleTheme.botName).toBe('Mi Bot')
    })

    it('should have custom CSS variables', () => {
      expect(customSimpleTheme.cssVariables.primary).toBe('280 100% 50%')
    })
  })

  describe('Custom Full Theme', () => {
    it('should have all custom properties', () => {
      expect(customFullTheme.primaryColor).toBe('hsl(340, 82%, 52%)')
      expect(customFullTheme.botName).toBe('Asistente Rosa')
      expect(customFullTheme.logoUrl).toBe('https://example.com/logo.png')
      expect(customFullTheme.position).toBe('bottom-left')
      expect(customFullTheme.welcomeMessage).toBe('¡Bienvenido! ¿Cómo te puedo ayudar?')
      expect(customFullTheme.inputPlaceholder).toBe('Escribe aquí...')
    })

    it('should have complete CSS variables', () => {
      const vars = customFullTheme.cssVariables
      expect(vars.background).toBe('330 100% 98%')
      expect(vars.foreground).toBe('340 90% 10%')
      expect(vars.primary).toBe('340 82% 52%')
      expect(vars.primaryForeground).toBe('0 0% 100%')
      expect(vars.radius).toBe('1.5rem')
    })
  })

  describe('Merged Theme', () => {
    it('should have merged values with defaults', () => {
      expect(mergedTheme).toBeDefined()
      expect(mergedTheme.primaryColor).toBe('hsl(220, 90%, 56%)')
      expect(mergedTheme.botName).toBe('Mi Asistente')
    })

    it('should have complete CSS variables after merge', () => {
      expect(mergedTheme.cssVariables).toBeDefined()
      expect(mergedTheme.cssVariables.primary).toBe('220 90% 56%')
      // Should have merged default values
      expect(mergedTheme.cssVariables.background).toBeDefined()
      expect(mergedTheme.cssVariables.foreground).toBeDefined()
    })
  })

  describe('Solid Styles', () => {
    it('should export myComponent with solid styles', () => {
      expect(myComponent).toBeDefined()
      expect(myComponent.backgroundColor).toMatch(/^hsl\(/)
      expect(myComponent.color).toMatch(/^hsl\(/)
      expect(myComponent.borderColor).toMatch(/^hsl\(/)
    })
  })

  describe('Container Style', () => {
    it('should have CSS variables', () => {
      expect(containerStyle).toBeDefined()
      expect((containerStyle as any)['--background']).toBeDefined()
      expect((containerStyle as any)['--foreground']).toBeDefined()
      expect((containerStyle as any)['--primary']).toBeDefined()
    })

    it('should have backgroundColor property', () => {
      expect(containerStyle.backgroundColor).toBe('hsl(var(--background))')
    })
  })

  describe('Dark Mode Component', () => {
    it('should export MyApp component', () => {
      expect(MyApp).toBeDefined()
      expect(typeof MyApp).toBe('function')
    })
  })

  // describe('Extended Theme', () => {
  //   it('should extend corporate theme', () => {
  //     expect(extendedTheme).toBeDefined()
  //     expect(extendedTheme.botName).toBe('Asistente Corporativo Pro')
  //     expect(extendedTheme.welcomeMessage).toBe('Bienvenido a nuestro sistema')
  //   })

  //   it('should override specific CSS variables', () => {
  //     expect(extendedTheme.cssVariables.radius).toBe('1rem')
  //   })

  //   it('should inherit other CSS variables from corporate theme', () => {
  //     expect(extendedTheme.cssVariables.primary).toBeDefined()
  //     expect(extendedTheme.cssVariables.background).toBeDefined()
  //   })
  // })

  // describe('Monochrome Theme', () => {
  //   it('should use variations of the same base color', () => {
  //     const vars = monochromeTheme.cssVariables
      
  //     expect(monochromeTheme.primaryColor).toMatch(/hsl\(221/)
  //     expect(vars.primary).toBe('221 83% 53%')
  //     expect(vars.foreground).toMatch(/^221/)
  //     expect(vars.card).toMatch(/^221/)
  //     expect(vars.muted).toMatch(/^221/)
  //   })

  //   it('should have destructive color as contrast', () => {
  //     expect(monochromeTheme.cssVariables.destructive).toBe('0 84% 60%')
  //   })
  // })

  // describe('Brand-Specific Themes', () => {
  //   describe('WhatsApp Theme', () => {
  //     it('should have WhatsApp green color', () => {
  //       expect(whatsAppTheme.primaryColor).toBe('hsl(142, 70%, 49%)')
  //       expect(whatsAppTheme.botName).toBe('WhatsApp Bot')
  //     })

  //     it('should have WhatsApp brand colors', () => {
  //       expect(whatsAppTheme.cssVariables.primary).toBe('142 70% 49%')
  //     })
  //   })

  //   describe('Slack Theme', () => {
  //     it('should have Slack blue color', () => {
  //       expect(slackTheme.primaryColor).toBe('hsl(211, 100%, 50%)')
  //       expect(slackTheme.botName).toBe('Slack Bot')
  //     })

  //     it('should have Slack brand colors', () => {
  //       expect(slackTheme.cssVariables.primary).toBe('211 100% 50%')
  //     })

  //     it('should have small border radius like Slack', () => {
  //       expect(slackTheme.cssVariables.radius).toBe('0.25rem')
  //     })
  //   })
  // })

  describe('Theme Structure Validation', () => {
    const themes = [
      { name: 'defaultTheme', theme: defaultTheme },
      // { name: 'darkTheme', theme: darkTheme },
      // { name: 'corporateTheme', theme: corporateTheme },
      // { name: 'minimalistTheme', theme: minimalistTheme },
      { name: 'customSimpleTheme', theme: customSimpleTheme },
      { name: 'customFullTheme', theme: customFullTheme },
      // { name: 'extendedTheme', theme: extendedTheme },
      // { name: 'monochromeTheme', theme: monochromeTheme },
      // { name: 'whatsAppTheme', theme: whatsAppTheme },
      // { name: 'slackTheme', theme: slackTheme },
    ]

    themes.forEach(({ name, theme }) => {
      it(`${name} should have required base properties`, () => {
        expect(theme.primaryColor).toBeDefined()
        expect(theme.cssVariables).toBeDefined()
      })

      it(`${name} cssVariables should have primary color`, () => {
        expect(theme.cssVariables.primary).toBeDefined()
      })
    })
  })

  describe('Color Format Validation', () => {
    it('should use HSL format for primary colors', () => {
      expect(defaultTheme.primaryColor).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
      expect(customFullTheme.primaryColor).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
      // expect(whatsAppTheme.primaryColor).toMatch(/^hsl\(\d+,\s*\d+%,\s*\d+%\)$/)
    })

    it('should use HSL values without hsl() wrapper in CSS variables', () => {
      expect(defaultTheme.cssVariables.primary).toMatch(/^\d+\s+\d+%\s+\d+%$/)
      expect(customSimpleTheme.cssVariables.primary).toMatch(/^\d+\s+\d+%\s+\d+%$/)
    })
  })

  describe('Radius Values', () => {
    it('should use rem units for border radius', () => {
      expect(customFullTheme.cssVariables.radius).toMatch(/rem$/)
      // expect(whatsAppTheme.cssVariables.radius).toMatch(/rem$/)
      // expect(slackTheme.cssVariables.radius).toMatch(/rem$/)
    })
  })

  // describe('Theme Inheritance', () => {
  //   it('extendedTheme should maintain corporate theme base', () => {
  //     // Should have inherited properties from corporate theme
  //     expect(extendedTheme.cssVariables.background).toBe(corporateTheme.cssVariables.background)
  //     expect(extendedTheme.cssVariables.primary).toBe(corporateTheme.cssVariables.primary)
  //   })

  //   it('extendedTheme should override specific properties', () => {
  //     // Should have different values from corporate theme
  //     expect(extendedTheme.botName).not.toBe(corporateTheme.botName)
  //     expect(extendedTheme.cssVariables.radius).not.toBe(corporateTheme.cssVariables.radius)
  //   })
  // })

  describe('Export Completeness', () => {
    it('should export all documented theme examples', () => {
      const exports = [
        defaultTheme,
        // darkTheme,
        // corporateTheme,
        // minimalistTheme,
        customSimpleTheme,
        customFullTheme,
        // extendedTheme,
        // monochromeTheme,
        // whatsAppTheme,
        // slackTheme,
      ]

      exports.forEach(exportedTheme => {
        expect(exportedTheme).toBeDefined()
      })
    })

    it('should export utility examples', () => {
      expect(mergedTheme).toBeDefined()
      expect(myComponent).toBeDefined()
      expect(containerStyle).toBeDefined()
      expect(MyApp).toBeDefined()
    })
  })
})
