import { Combobox } from '@base-ui/react/combobox'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

it('supports popup search, multiple selection, independent chip removal and focus return', async () => {
  const user = userEvent.setup()

  render(
    <Combobox.Root multiple items={['Alex', 'Sam']} defaultValue={['Alex']}>
      <Combobox.Chips>
        <Combobox.Value>
          {(values: string[]) =>
            values.map((value) => (
              <Combobox.Chip key={value}>
                {value}
                <Combobox.ChipRemove aria-label={`Remove ${value}`} />
              </Combobox.Chip>
            ))
          }
        </Combobox.Value>
      </Combobox.Chips>
      <Combobox.Trigger aria-label="Owners">Add owners</Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.Input aria-label="Search owners" />
            <Combobox.List>
              {(value: string) => (
                <Combobox.Item key={value} value={value}>
                  {value}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>,
  )
  await user.click(screen.getByRole('combobox', { name: 'Owners' }))
  const search = await screen.findByRole('combobox', { name: 'Search owners' })

  await waitFor(() => expect(search).toHaveFocus())
  await user.type(search, 'Sam')
  await user.keyboard('{ArrowDown}{Enter}')
  expect(await screen.findByRole('button', { name: 'Remove Sam' })).toBeInTheDocument()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveFocus())
  await user.click(screen.getByRole('button', { name: 'Remove Alex' }))
  expect(screen.queryByRole('button', { name: 'Remove Alex' })).not.toBeInTheDocument()
  expect(screen.getByRole('combobox', { name: 'Owners' })).toHaveAttribute('aria-expanded', 'false')
})
