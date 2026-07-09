import { render, screen } from '@testing-library/react'
import { useEffect } from 'react'

import { useAppForm } from '~/hooks/forms/useAppform'

import { clearServerFieldErrors, setServerFieldErrors } from '../serverFieldErrors'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (k: string) => (k === 'FIELD_KEY' ? 'REJECTED_TEXT' : k),
  }),
}))

const Harness = ({ action }: { action: 'set' | 'clear' }) => {
  const form = useAppForm({ defaultValues: { amount: '' } })

  useEffect(() => {
    setServerFieldErrors(form as never, [{ path: 'amount', code: 'x' }], 'FIELD_KEY')
    if (action === 'clear') clearServerFieldErrors(form as never, ['amount'])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <form.AppField name="amount">
      {(field) => <field.TextInputField label="Amount" />}
    </form.AppField>
  )
}

describe('serverFieldErrors rendering', () => {
  it('renders the translated field error message when set', () => {
    render(<Harness action="set" />)
    expect(screen.getByText('REJECTED_TEXT')).toBeInTheDocument()
  })

  it('removes the field error message when cleared', () => {
    render(<Harness action="clear" />)
    expect(screen.queryByText('REJECTED_TEXT')).not.toBeInTheDocument()
  })
})
