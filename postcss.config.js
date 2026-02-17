/**
 * PostCSS Configuration
 * Standard Tailwind CSS v4 pipeline — CSS isolation handled by Shadow DOM
 */

export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      cssnano: {
        preset: ['default', {
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          minifyFontValues: true,
          minifyGradients: true,
          minifySelectors: true,
          mergeLonghand: true,
          mergeRules: true,
          reduceIdents: false,
          zindex: false,
        }]
      }
    } : {})
  },
}
