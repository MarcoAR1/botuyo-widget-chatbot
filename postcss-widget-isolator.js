/**
 * PostCSS Plugin: Widget CSS Isolator
 * 
 * Scopes ALL CSS output under #botuyo-chat-widget-root to prevent
 * the widget's Tailwind CSS from leaking into host pages.
 * 
 * What it does:
 * 1. Prefixes all selectors with #botuyo-chat-widget-root
 * 2. Converts :root selectors to #botuyo-chat-widget-root
 * 3. Removes @layer declarations (they affect global layer ordering in host pages)
 * 4. Leaves @keyframes, @media, @supports, @property untouched
 * 5. Skips selectors already scoped to #botuyo-chat-widget-root
 */

const WIDGET_ROOT = '#botuyo-chat-widget-root';

/**
 * @type {import('postcss').PluginCreator}
 */
const widgetCssIsolator = () => {
  return {
    postcssPlugin: 'widget-css-isolator',

    // Process after all other plugins (including Tailwind)
    Once(root) {
      // 1. Remove @layer at-rules by unwrapping their contents
      root.walkAtRules('layer', (atRule) => {
        // Move children out of @layer, then remove the @layer wrapper
        // This prevents @layer from affecting host page layer ordering
        if (atRule.nodes && atRule.nodes.length > 0) {
          atRule.replaceWith(atRule.nodes);
        } else {
          atRule.remove();
        }
      });

      // 2. Prefix all rules
      root.walkRules((rule) => {
        // Skip rules inside @keyframes (keyframe selectors like 0%, to, from)
        if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'keyframes') {
          return;
        }

        // Transform each selector
        rule.selectors = rule.selectors.map((selector) => {
          // Already scoped — skip
          if (selector.includes(WIDGET_ROOT)) {
            return selector;
          }

          // :root → #botuyo-chat-widget-root
          if (selector === ':root') {
            return WIDGET_ROOT;
          }
          if (selector.startsWith(':root')) {
            return selector.replace(':root', WIDGET_ROOT);
          }

          // ::backdrop, ::file-selector-button, ::view-transition* — scope to widget
          if (selector.startsWith('::backdrop') ||
              selector.startsWith('::file-selector-button') ||
              selector.startsWith('::view-transition')) {
            return `${WIDGET_ROOT} ${selector}`;
          }

          // html, body, :host — convert to widget root
          if (selector === 'html' || selector === 'body' || selector === ':host') {
            return WIDGET_ROOT;
          }
          if (selector.startsWith('html ') || selector.startsWith('body ')) {
            return selector.replace(/^(html|body)\s+/, `${WIDGET_ROOT} `);
          }

          // Universal selector * → #botuyo-chat-widget-root *
          if (selector === '*') {
            return `${WIDGET_ROOT} *`;
          }

          // Pseudo-elements on universal: *, ::after, ::before → scoped
          if (/^\*?\s*,?\s*::/.test(selector)) {
            return `${WIDGET_ROOT} ${selector}`;
          }

          // Prefix all other selectors
          return `${WIDGET_ROOT} ${selector}`;
        });
      });
    },
  };
};

widgetCssIsolator.postcss = true;

export default widgetCssIsolator;
