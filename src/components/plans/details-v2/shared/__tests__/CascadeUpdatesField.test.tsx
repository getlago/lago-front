import { revalidateLogic } from '@tanstack/react-form'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import {
  CascadeUpdatesField,
  cascadeUpdatesFieldDefaultValues,
  CascadeUpdatesFieldDefaultValues,
} from '../CascadeUpdatesField'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const Wrapper = ({ onSubmit }: { onSubmit: (v: boolean) => void }) => {
  const form = useAppForm({
    defaultValues: cascadeUpdatesFieldDefaultValues as CascadeUpdatesFieldDefaultValues,
    validationLogic: revalidateLogic(),
    onSubmit: ({ value }) => onSubmit(value.cascadeUpdates),
  })

  return (
    <form.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <CascadeUpdatesField form={form} />
        <button type="submit">submit</button>
      </form>
    </form.AppForm>
  )
}

describe('CascadeUpdatesField', () => {
  it('renders the toggle label + sublabel translation keys', () => {
    render(<Wrapper onSubmit={() => undefined} />)

    expect(screen.getByText('text_1779289915866s3gisblcite')).toBeInTheDocument()
    expect(screen.getByText('text_1779289915866itrqeyj7658')).toBeInTheDocument()
  })

  it('defaults to true (V2 toggle UX) and surfaces it on submit', async () => {
    const handleSubmit = jest.fn()

    render(<Wrapper onSubmit={handleSubmit} />)

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    })

    expect(handleSubmit).toHaveBeenCalledWith(true)
  })

  it('toggles the field value and reports it on submit', async () => {
    const handleSubmit = jest.fn()

    render(<Wrapper onSubmit={handleSubmit} />)

    const toggle = screen.getByRole('checkbox', { name: 'cascadeUpdates' })

    expect(toggle).toBeChecked()

    await act(async () => {
      await userEvent.click(toggle)
      await userEvent.click(screen.getByRole('button', { name: /submit/i }))
    })

    expect(handleSubmit).toHaveBeenCalledWith(false)
  })
})
