/**
 * useFormObserver — Auto-scans page forms and listens for structured bridge overrides.
 *
 * Two data sources (bridge override wins):
 * 1. Auto-scan: MutationObserver + input scanning — works on any page without extra code
 * 2. Bridge: postMessage from useFormBridge/useOnboardingBridge — structured data from React state
 *
 * Emits form_state to backend via the provided emit callback whenever state changes.
 *
 * Form state shape sent to backend:
 * {
 *   source: 'bridge' | 'auto-scan',
 *   page: string,            // current URL path
 *   forms: [{
 *     id: string,
 *     fields: [{ name, label, value, type, required, error? }],
 *     step?: number | string,
 *     error?: string
 *   }]
 * }
 */

import { useEffect, useRef, useCallback } from 'react'

export interface FormFieldState {
  name: string
  label: string
  value: string
  type: string
  required: boolean
  error?: string
}

export interface FormState {
  id: string
  fields: FormFieldState[]
  step?: number | string
  error?: string
}

export interface PageFormState {
  source: 'bridge' | 'auto-scan'
  page: string
  forms: FormState[]
}

interface UseFormObserverOptions {
  emit: (state: PageFormState) => void
  enabled?: boolean
  scanIntervalMs?: number
}

function getTargetWindow(): Window {
  try {
    // If we're in shadow DOM or iframe, try to access the host page
    if (window.parent !== window) return window.parent
  } catch (_e) { /* cross-origin */ }
  return window
}

function scanDomForms(): FormState[] {
  const target = getTargetWindow()
  let doc: Document
  try {
    doc = target.document
  } catch (_e) {
    return [] // cross-origin, can't scan
  }

  const forms: FormState[] = []
  const formElements = doc.querySelectorAll('form')

  // Also scan "virtual forms" — divs with inputs that aren't inside a <form>
  const allInputs = doc.querySelectorAll('input, textarea, select')
  const orphanInputs = Array.from(allInputs).filter(el => !el.closest('form'))

  const processInputs = (inputs: Element[], formId: string): FormFieldState[] => {
    return Array.from(inputs)
      .filter(el => {
        const type = (el as HTMLInputElement).type
        return type !== 'hidden' && type !== 'submit' && type !== 'button'
      })
      .map(el => {
        const input = el as HTMLInputElement
        const name = input.name || input.id || input.getAttribute('data-field') || ''
        if (!name) return null

        // Find label
        let label = ''
        const labelEl = input.labels?.[0] || doc.querySelector(`label[for="${input.id}"]`)
        if (labelEl) label = labelEl.textContent?.trim() || ''
        if (!label) {
          // Try aria-label or placeholder
          label = input.getAttribute('aria-label') || input.placeholder || name
        }

        // Check for validation error
        let error: string | undefined
        const errorEl = input.parentElement?.querySelector('[class*="error"], [role="alert"]')
        if (errorEl) error = errorEl.textContent?.trim()
        if (input.validationMessage) error = input.validationMessage

        return {
          name,
          label,
          value: input.value || '',
          type: input.type || input.tagName.toLowerCase(),
          required: input.required || input.getAttribute('aria-required') === 'true',
          error
        }
      })
      .filter((f): f is FormFieldState => f !== null)
  }

  // Process actual <form> elements
  formElements.forEach((formEl, i) => {
    const inputs = formEl.querySelectorAll('input, textarea, select')
    const fields = processInputs(Array.from(inputs), formEl.id || `form-${i}`)
    if (fields.length > 0) {
      forms.push({
        id: formEl.id || formEl.getAttribute('data-form-id') || `form-${i}`,
        fields
      })
    }
  })

  // Process orphan inputs as a "virtual form"
  if (orphanInputs.length > 0) {
    const fields = processInputs(orphanInputs, 'page-fields')
    if (fields.length > 0) {
      forms.push({ id: 'page-fields', fields })
    }
  }

  return forms
}

export function useFormObserver({ emit, enabled = true, scanIntervalMs = 3000 }: UseFormObserverOptions) {
  const bridgeStateRef = useRef<PageFormState | null>(null)
  const lastEmittedRef = useRef<string>('')
  const emitRef = useRef(emit)
  emitRef.current = emit

  const emitIfChanged = useCallback((state: PageFormState) => {
    const serialized = JSON.stringify(state)
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized
      emitRef.current(state)
    }
  }, [])

  // Listen for structured bridge data (useFormBridge / useOnboardingBridge)
  useEffect(() => {
    if (!enabled) return

    const handler = (event: MessageEvent) => {
      // Handle botuyo-onboarding-state (from useOnboardingBridge)
      if (event.data?.type === 'botuyo-onboarding-state') {
        const { page, step, fields, error } = event.data
        const bridgeState: PageFormState = {
          source: 'bridge',
          page: page || window.location.pathname,
          forms: [{
            id: `${page}-form`,
            fields: Object.entries(fields || {}).map(([name, value]) => ({
              name,
              label: name,
              value: String(value ?? ''),
              type: 'text',
              required: false
            })),
            step,
            error
          }]
        }
        bridgeStateRef.current = bridgeState
        emitIfChanged(bridgeState)
        return
      }

      // Handle generic botuyo-form-state (from useFormBridge)
      if (event.data?.type === 'botuyo-form-state') {
        const state: PageFormState = {
          source: 'bridge',
          page: event.data.page || window.location.pathname,
          forms: event.data.forms || []
        }
        bridgeStateRef.current = state
        emitIfChanged(state)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [enabled, emitIfChanged])

  // Auto-scan DOM forms on interval (only if no bridge data)
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      // Bridge data takes priority — skip scan if bridge is active
      if (bridgeStateRef.current) return

      const forms = scanDomForms()
      if (forms.length > 0) {
        emitIfChanged({
          source: 'auto-scan',
          page: window.location.pathname,
          forms
        })
      }
    }, scanIntervalMs)

    return () => clearInterval(interval)
  }, [enabled, scanIntervalMs, emitIfChanged])

  // Also forward form:command events from socket to the page
  useEffect(() => {
    if (!enabled) return

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'botuyo-form-command') {
        // Forward to the target window (parent page)
        try {
          getTargetWindow().postMessage(event.data, '*')
        } catch (_e) {
          window.postMessage(event.data, '*')
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [enabled])
}
