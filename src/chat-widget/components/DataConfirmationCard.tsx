import { useEffect, useRef, useState } from 'react'

export type ConfirmationRequest = {
  requestId: string
  fields: { key: string; label: string; type: 'text' | 'email' | 'tel'; value: string }[]
}
export type ConfirmationResult = { requestId: string; status: string; values?: Record<string, string> }

export function parseConfirmationRequest(data: unknown): ConfirmationRequest | null {
  const r = data as ConfirmationRequest
  if (!r || typeof r.requestId !== 'string' || !r.requestId || !Array.isArray(r.fields) || r.fields.length < 1 || r.fields.length > 6) return null
  const keys = new Set<string>()
  for (const f of r.fields) {
    if (!f || typeof f.key !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]{0,39}$/.test(f.key) || keys.has(f.key) ||
      typeof f.label !== 'string' || !f.label.trim() || f.label.length > 100 ||
      !['text', 'email', 'tel'].includes(f.type) || typeof f.value !== 'string' || f.value.length > 254) return null
    keys.add(f.key)
  }
  return r
}

export function DataConfirmationCard({ request, result, onSubmit, language = 'es' }: {
  request: ConfirmationRequest
  result?: ConfirmationResult
  onSubmit: (payload: { requestId: string; values: Record<string, string>; cancel: boolean }) => boolean
  language?: string
}) {
  const en = language.startsWith('en')
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(request.fields.map(f => [f.key, f.value])))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const failure = en ? 'Could not confirm. Check the data and connection, then retry.' : 'No se pudo confirmar. Revisá los datos y la conexión y reintentá.'
  const resolved = result?.status === 'confirmed' || result?.status === 'cancelled'

  useEffect(() => {
    if (!result) return
    clearTimeout(timer.current)
    inFlight.current = false
    setPending(false)
    setError(result.status === 'error' ? failure : '')
  }, [result, failure])
  useEffect(() => () => clearTimeout(timer.current), [])

  function submit(cancel: boolean) {
    if (inFlight.current || resolved) return
    const normalized = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
    if (!cancel && request.fields.some(f => !normalized[f.key] ||
      (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized[f.key])) ||
      (f.type === 'tel' && (!/^\+?[0-9 ()-]{7,30}$/.test(normalized[f.key]) || normalized[f.key].replace(/\D/g, '').length < 7 || normalized[f.key].replace(/\D/g, '').length > 15)))) {
      setError(en ? 'Check the highlighted data before confirming.' : 'Revisá los datos antes de confirmar.')
      return
    }
    inFlight.current = true
    setError('')
    setPending(true)
    if (!onSubmit({ requestId: request.requestId, values: normalized, cancel })) {
      inFlight.current = false
      setPending(false)
      setError(failure)
      return
    }
    timer.current = setTimeout(() => { inFlight.current = false; setPending(false); setError(failure) }, 10000)
  }

  return <form aria-label={en ? 'Confirm your details' : 'Confirmá tus datos'} onSubmit={e => { e.preventDefault(); submit(false) }}
    style={{ color: '#fff', background: '#202028', border: '1px solid #555563', borderRadius: 12, padding: 16 }}>
    <strong>{en ? 'Did I get this right?' : '¿Lo anoté bien?'}</strong>
    <p style={{ fontSize: 13, margin: '6px 0 12px', color: '#d6d6de' }}>
      {en ? 'Edit any detail before confirming.' : 'Podés corregir cada dato antes de confirmarlo.'}
    </p>
    {request.fields.map(f => <label key={f.key} style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
      {f.label}
      <input type={f.type} value={result?.status === 'confirmed' ? result.values?.[f.key] ?? values[f.key] : values[f.key]}
        required maxLength={254} disabled={pending || resolved} autoComplete={f.type === 'email' ? 'email' : f.key === 'name' ? 'name' : 'off'}
        autoCapitalize={f.type === 'email' ? 'none' : undefined} spellCheck={false}
        onChange={e => setValues(old => ({ ...old, [f.key]: e.target.value }))}
        style={{ display: 'block', boxSizing: 'border-box', width: '100%', background: '#101017', color: '#fff', border: '1px solid #777785', borderRadius: 6, padding: '10px', marginTop: 4, fontSize: 16 }} />
    </label>)}
    {error && <p role="alert" style={{ color: '#ffb6a7', fontSize: 13 }}>{error}</p>}
    {resolved ? <p role="status">{result.status === 'confirmed' ? (en ? 'Details confirmed' : 'Datos confirmados') : (en ? 'Cancelled' : 'Confirmación cancelada')}</p> :
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={pending} style={{ padding: '10px 16px', borderRadius: 6, color: '#fff', background: '#b83b00', border: 0 }}>
          {pending ? (en ? 'Confirming…' : 'Confirmando…') : (en ? 'Confirm details' : 'Confirmar datos')}
        </button>
        <button type="button" disabled={pending} onClick={() => submit(true)} style={{ padding: '10px', background: 'transparent', color: '#fff', border: '1px solid #777785', borderRadius: 6 }}>
          {en ? 'Cancel' : 'Cancelar'}
        </button>
      </div>}
  </form>
}
