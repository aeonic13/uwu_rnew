import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AreaPicker from './AreaPicker'

describe('AreaPicker', () => {
  it('offers listed cities and shows neighborhood chips once a city is picked', () => {
    const onChange = vi.fn()
    render(<AreaPicker city="" areas={[]} onChange={onChange} />)

    const select = screen.getByLabelText('Where')
    expect(screen.queryByRole('group')).toBeNull()
    fireEvent.change(select, { target: { value: 'San Diego' } })
    expect(onChange).toHaveBeenCalledWith({ city: 'San Diego', areas: [] })
  })

  it('toggles neighborhoods and clears them with "Anywhere"', () => {
    const onChange = vi.fn()
    render(
      <AreaPicker
        city="San Diego"
        areas={['Pacific Beach']}
        onChange={onChange}
      />
    )

    const group = screen.getByRole('group', { name: 'Areas in San Diego' })
    expect(group).toHaveTextContent('Pacific Beach')
    expect(group).toHaveTextContent('Mission Beach')
    expect(
      screen.getByRole('button', { name: 'Pacific Beach' })
    ).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Mission Beach' }))
    expect(onChange).toHaveBeenLastCalledWith({
      city: 'San Diego',
      areas: ['Pacific Beach', 'Mission Beach'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'Pacific Beach' }))
    expect(onChange).toHaveBeenLastCalledWith({ city: 'San Diego', areas: [] })

    fireEvent.click(
      screen.getByRole('button', { name: /anywhere in san diego/i })
    )
    expect(onChange).toHaveBeenLastCalledWith({ city: 'San Diego', areas: [] })
  })

  it('falls back to free text for an unlisted city, with no chips', () => {
    const onChange = vi.fn()
    render(<AreaPicker city="" areas={[]} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Where'), {
      target: { value: '__other__' },
    })
    fireEvent.change(screen.getByLabelText('Other city'), {
      target: { value: 'Tempe' },
    })
    expect(onChange).toHaveBeenLastCalledWith({ city: 'Tempe', areas: [] })
    expect(screen.queryByRole('group')).toBeNull()
  })
})
