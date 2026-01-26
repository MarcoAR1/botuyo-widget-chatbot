/**
 * PostCSS Configuration
 * Optimizes CSS with cssnano for production builds
 */

export default {
  plugins: {
    cssnano: {
      preset: [
        'advanced',
        {
          // Optimizations
          discardComments: {
            removeAll: true,
          },
          reduceIdents: true,
          mergeRules: true,
          mergeLonghand: true,
          minifySelectors: true,
          minifyParams: true,
          normalizeWhitespace: true,
          
          // CSS Variables - preserve for theming
          discardUnused: {
            fontFace: false,
          },
          
          // Z-index optimization (preserve our stacking)
          zindex: false,
          
          // Grid optimization
          cssDeclarationSorter: {
            order: 'smacss',
          },
        },
      ],
    },
  },
};
