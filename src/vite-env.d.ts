/// <reference types="vite/client" />

// Allow ?inline CSS imports
declare module '*.css?inline' {
  const css: string;
  export default css;
}
