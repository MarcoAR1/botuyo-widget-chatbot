/**
 * @package @botuyo/chat-widget
 * Exportaciones centrales del sistema de temas
 * 
 * Importa desde aquí todo lo relacionado con temas:
 * import { DEFAULT_THEME, getSolidStyles, mergeThemeWithDefaults } from './utils/themes'
 */

// Tipos
export type { CSSVariables } from '../theme'

// Constantes de Variables CSS
export {
  DEFAULT_CSS_VARIABLES,
  DARK_CSS_VARIABLES,
} from '../theme'

// Temas Predefinidos
export {
  DEFAULT_THEME,
  // PASEO_LIBRE_DARK_THEME,
  // CORPORATE_BLUE_THEME,
  // MINIMALIST_THEME,
} from '../theme'

// Utilidades
export {
  mergeThemeWithDefaults,
  getPrimaryColor,
  cssVariablesToInlineStyles,
  getSolidStyles,
} from '../theme'
