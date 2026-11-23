import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Input, PasswordInput } from '../input'

describe('Input', () => {
  afterEach(cleanup)

  it('renders a native input with a placeholder', async () => {
    await act(() => render(<Input placeholder="Type here" />))

    const input = screen.getByPlaceholderText('Type here')

    expect(input.tagName).toBe('INPUT')
  })

  it('renders the provided value', async () => {
    await act(() => render(<Input defaultValue="With a value" readOnly />))

    expect(screen.getByDisplayValue('With a value')).toBeInTheDocument()
  })

  it('respects the type prop', async () => {
    await act(() => render(<Input type="password" placeholder="Secret" />))

    expect(screen.getByPlaceholderText('Secret')).toHaveAttribute('type', 'password')
  })

  it('disables the input', async () => {
    await act(() => render(<Input placeholder="Disabled" disabled />))

    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('applies the invalid-state classes when aria-invalid is set', async () => {
    await act(() => render(<Input placeholder="Invalid" aria-invalid />))

    const input = screen.getByPlaceholderText('Invalid')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('merges a custom className without losing the base classes', async () => {
    await act(() => render(<Input placeholder="Custom" className="pl-9" />))

    const input = screen.getByPlaceholderText('Custom')

    expect(input).toHaveClass('pl-9')
    expect(input).toHaveClass('rounded-lg')
  })

  it('calls onChange as the user types', async () => {
    const onChange = jest.fn()

    await act(() => render(<Input placeholder="Type something" onChange={onChange} />))

    await waitFor(() => userEvent.type(screen.getByPlaceholderText('Type something'), 'hi'))

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(screen.getByPlaceholderText('Type something')).toHaveValue('hi')
  })

  it('uses the requested numeric typography instead of the body default', async () => {
    await act(() => render(<Input aria-label="Amount" className="v2-text-number" />))

    const input = screen.getByRole('textbox', { name: 'Amount' })

    expect(input).toHaveClass('v2-text-number')
    expect(input).not.toHaveClass('v2-text-body')
    expect(input).toHaveClass('rounded-lg')
  })

  it('forwards the ref to the underlying input element', async () => {
    const ref = { current: null as HTMLInputElement | null }

    await act(() => render(<Input ref={ref} placeholder="Ref target" />))

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
    expect(ref.current).toBe(screen.getByPlaceholderText('Ref target'))
  })
})

describe('PasswordInput', () => {
  afterEach(cleanup)

  it('reveals without changing the value or submitting the form', async () => {
    const user = userEvent.setup()
    const submit = jest.fn((event) => event.preventDefault())

    render(
      <form onSubmit={submit}>
        <PasswordInput
          aria-label="Password"
          defaultValue="secret"
          showPasswordLabel="Show password"
          hidePasswordLabel="Hide password"
        />
      </form>,
    )
    const input = screen.getByLabelText('Password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('secret')
    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
    expect(submit).not.toHaveBeenCalled()
  })

  it('does not allow revealing a disabled password', async () => {
    render(
      <PasswordInput
        aria-label="Password"
        disabled
        showPasswordLabel="Show password"
        hidePasswordLabel="Hide password"
      />,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
