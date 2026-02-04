/**
 * PostCSS Configuration
 * Procesa Tailwind CSS v4 y optimiza con cssnano en producción
 */

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    // Optimización de CSS con cssnano (solo en producción)
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          // Opciones de optimización segura
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifySelectors: true,
          mergeLonghand: true,
          mergeRules: true,
          reduceIdents: false, // No minificar @keyframes
          zindex: false, // No optimizar z-index
        }]
      }
    } : {})
  },
}
