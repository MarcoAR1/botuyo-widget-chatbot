import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { DataConfirmationCard, parseConfirmationRequest } from '@/chat-widget/components/DataConfirmationCard'

const request = { requestId: 'r1', fields: [
  { key: 'email', label: 'Email', type: 'email' as const, value: 'ana@gmal.com' },
  { key: 'name', label: 'Nombre', type: 'text' as const, value: 'Ana Perez' }
] }
afterEach(() => vi.useRealTimers())
describe('Editable voice data confirmation', () => {
  it('keeps exact corrections, waits for server acknowledgement and prevents double submission', () => {
    const submit = vi.fn(() => true)
    const { rerender } = render(<DataConfirmationCard request={request} onSubmit={submit} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ana+demo@gmail.com' } })
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Pérez' } })
    fireEvent.click(screen.getByText('Confirmar datos'))
    fireEvent.submit(screen.getByRole('form'))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit).toHaveBeenCalledWith({ requestId: 'r1', values: { email: 'ana+demo@gmail.com', name: 'Ana Pérez' }, cancel: false })
    expect(screen.queryByText('Datos confirmados')).not.toBeInTheDocument()
    rerender(<DataConfirmationCard request={request} onSubmit={submit} result={{ requestId: 'r1', status: 'confirmed', values: { email: 'ana+demo@gmail.com', name: 'Ana Pérez' } }} />)
    expect(screen.getByText('Datos confirmados')).toBeInTheDocument()
  })
  it('rejects malformed email and blank required name', () => {
    const submit = vi.fn(() => true)
    render(<DataConfirmationCard request={request} onSubmit={submit} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } })
    fireEvent.submit(screen.getByRole('form'))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('preserves input after disconnection and permits a retry', () => {
    const submit = vi.fn(() => false)
    render(<DataConfirmationCard request={request} onSubmit={submit} />)
    fireEvent.click(screen.getByText('Confirmar datos'))
    expect(screen.getByLabelText('Email')).toHaveValue('ana@gmal.com')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Confirmar datos')).toBeEnabled()
  })
  it('times out without declaring success and retries the same request id', () => {
    vi.useFakeTimers()
    const submit = vi.fn(() => true)
    render(<DataConfirmationCard request={request} onSubmit={submit} />)
    fireEvent.click(screen.getByText('Confirmar datos'))
    act(() => vi.advanceTimersByTime(10001))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Confirmar datos'))
    expect(submit).toHaveBeenCalledTimes(2)
  })
  it('allows cancelling incomplete data', () => {
    const submit = vi.fn(() => true)
    render(<DataConfirmationCard request={request} onSubmit={submit} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '' } })
    fireEvent.click(screen.getByText('Cancelar'))
    expect(submit.mock.calls[0]).toEqual([{ requestId: 'r1', values: { email: '', name: 'Ana Perez' }, cancel: true }])
  })
  it('rejects invalid or repeated fields from the socket', () => {
    expect(parseConfirmationRequest({ requestId: 'r', fields: [request.fields[0], request.fields[0]] })).toBeNull()
    expect(parseConfirmationRequest({ requestId: 'r', fields: [{ ...request.fields[0], type: 'password' }] })).toBeNull()
    expect(parseConfirmationRequest(request)).toEqual(request)
  })
})
