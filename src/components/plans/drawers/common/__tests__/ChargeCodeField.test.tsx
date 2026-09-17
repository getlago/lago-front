import { render, screen } from '@testing-library/react'

import { useAppForm } from '~/hooks/forms/useAppform'

import ChargeCodeField from '../ChargeCodeField'

const Host = ({ disabled, code = '' }: { disabled?: boolean; code?: string }) => {
  const form = useAppForm({ defaultValues: { code } })

  return <ChargeCodeField form={form} fields={{ code: 'code' }} disabled={disabled} />
}

describe('ChargeCodeField', () => {
  it('renders an editable code input by default', () => {
    render(<Host />)

    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })

  it('disables the input when disabled is true', () => {
    render(<Host disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
