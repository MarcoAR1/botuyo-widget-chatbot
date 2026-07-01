'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AnimationConfig, EffectsConfig } from '../types'
import { logger } from '../utils/logger'

/**
 * Default animation configuration - all premium features enabled
 */
export const defaultAnimationConfig: Required<AnimationConfig> = {
  enabled: true,
  messageEntry: 'spring',
  typingIndicator: 'wave',
  buttonEffects: true,
  smoothScroll: true,
  speedMultiplier: 1,
  staggerDelay: 50,
  windowTransitions: true,
  launcherPulse: true,
}

/**
 * Default effects configuration - premium effects enabled
 */
export const defaultEffectsConfig: Required<EffectsConfig> = {
  glassmorphism: true,
  gradients: true,
  softShadows: true,
  glowEffects: true,
  particles: false, // Off by default for performance
  soundEffects: false, // Off by default for accessibility
  hapticFeedback: true,
  shimmerLoading: true,
  hoverLift: true,
}

// -- Contexts --
const AnimationContext = createContext<Required<AnimationConfig>>(defaultAnimationConfig)
const EffectsContext = createContext<Required<EffectsConfig>>(defaultEffectsConfig)

export interface PremiumConfigProviderProps {
  children: ReactNode
  animations?: AnimationConfig
  effects?: EffectsConfig
}

/**
 * Provider for premium animation and effects configuration
 * Wraps components to give them access to animation/effects settings
 */
export function PremiumConfigProvider({
  children,
  animations,
  effects,
}: PremiumConfigProviderProps) {
  // Merge with defaults
  const animationValue = useMemo(
    () => ({
      ...defaultAnimationConfig,
      ...animations,
    }),
    [animations]
  )

  const effectsValue = useMemo(
    () => ({
      ...defaultEffectsConfig,
      ...effects,
    }),
    [effects]
  )

  return (
    <AnimationContext.Provider value={animationValue}>
      <EffectsContext.Provider value={effectsValue}>
        {children}
      </EffectsContext.Provider>
    </AnimationContext.Provider>
  )
}

// -- Hooks --

/**
 * Access animation configuration
 * @returns Current animation config with all defaults applied
 */
export function useAnimations(): Required<AnimationConfig> {
  return useContext(AnimationContext)
}

/**
 * Access effects configuration
 * @returns Current effects config with all defaults applied
 */
export function useEffects(): Required<EffectsConfig> {
  return useContext(EffectsContext)
}

/**
 * Check if animations are globally enabled
 */
export function useAnimationsEnabled(): boolean {
  const config = useContext(AnimationContext)
  return config.enabled
}

/**
 * Get animation duration with speed multiplier applied
 * @param baseDuration - Base duration in ms
 * @returns Adjusted duration
 */
export function useAnimationDuration(baseDuration: number): number {
  const config = useContext(AnimationContext)
  if (!config.enabled) return 0
  return baseDuration * config.speedMultiplier
}

/**
 * Get CSS class for message entry animation based on config
 */
export function useMessageEntryClass(): string {
  const config = useContext(AnimationContext)
  if (!config.enabled || config.messageEntry === 'none') return ''
  
  const classMap: Record<string, string> = {
    slide: 'animate-message-slide',
    fade: 'animate-message-fade',
    scale: 'animate-message-scale',
    spring: 'animate-message-spring',
  }
  
  return classMap[config.messageEntry] || 'animate-message-spring'
}

/**
 * Get CSS class for typing indicator animation based on config
 */
export function useTypingIndicatorClass(): string {
  const config = useContext(AnimationContext)
  if (!config.enabled || config.typingIndicator === 'none') return ''
  
  const classMap: Record<string, string> = {
    dots: 'animate-typing-dots',
    wave: 'animate-typing-wave',
    pulse: 'animate-typing-pulse',
  }
  
  return classMap[config.typingIndicator] || 'animate-typing-wave'
}

/**
 * Get stagger delay for sequential animations
 * @param index - Item index in sequence
 * @returns Delay in ms
 */
export function useStaggerDelay(index: number): number {
  const config = useContext(AnimationContext)
  if (!config.enabled) return 0
  return index * config.staggerDelay * config.speedMultiplier
}

/**
 * Hook for applying premium effects based on config
 */
export function usePremiumEffects() {
  const effects = useContext(EffectsContext)
  
  return {
    // Class generators
    getGlassClass: () => effects.glassmorphism ? 'backdrop-blur-md bg-white/80 dark:bg-black/80' : '',
    getShadowClass: () => effects.softShadows ? 'shadow-soft-xl' : 'shadow-md',
    getGlowClass: () => effects.glowEffects ? 'hover:shadow-primary/20' : '',
    getHoverLiftClass: () => effects.hoverLift ? 'hover:-translate-y-1 hover:shadow-lg transition-all' : '',
    getGradientClass: () => effects.gradients ? 'bg-gradient-to-br from-primary/10 to-transparent' : '',
    getShimmerClass: () => effects.shimmerLoading ? 'animate-shimmer' : 'animate-pulse',
    
    // Actions
    triggerHaptic: () => {
      if (effects.hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10)
      }
    },
    playSound: (type: 'send' | 'receive' | 'notification') => {
      if (!effects.soundEffects) return
      // Sound effects would be implemented here
      logger.debug(`[AnimationContext] Sound: ${type}`)
    },
    triggerParticles: (element: HTMLElement) => {
      if (!effects.particles) return
      // Particle effect would be implemented here
      logger.debug('[AnimationContext] Particles triggered on', element)
    },
  }
}
