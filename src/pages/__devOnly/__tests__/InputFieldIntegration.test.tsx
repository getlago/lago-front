import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { InputFieldIntegration } from '../InputFieldIntegration'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string): string => key }),
}))

it('clears Addable values and errors on deletion, returns focus, and reopens empty', async () => {
  const user = userEvent.setup()

  render(<InputFieldIntegration />)
  await user.type(screen.getByLabelText('Name'), 'Customer')
  await user.click(screen.getByText('Add a note'))
  const input = screen.getByLabelText('Note')

  await waitFor(() => expect(input).toHaveFocus())
  await user.type(input, 'A private note')
  await user.click(screen.getByRole('button', { name: 'Delete' }))
  expect(screen.queryByLabelText('Note')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Form values')).not.toHaveTextContent('A private note')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add a note' })).toHaveFocus())
  await user.click(screen.getByText('Add a note'))
  expect(screen.getByLabelText('Note')).toHaveValue('')
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(await screen.findByText('Enter a note or remove the field')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Submit' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Submitted successfully')
  await user.click(screen.getByText('Add a note'))
  expect(screen.getByLabelText('Note')).toHaveValue('')
  await user.type(screen.getByLabelText('Note'), 'Another value')
  await user.click(screen.getByText('Reset'))
  expect(screen.queryByLabelText('Note')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Name')).toHaveValue('')
})
