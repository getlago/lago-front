import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { SectionAccordion } from '../SectionAccordion'

describe('SectionAccordion', () => {
  it('renders the summary content', () => {
    render(
      <SectionAccordion title="Charge A" subtitle="USD">
        <div>body</div>
      </SectionAccordion>,
    )

    expect(screen.getByText('Charge A')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('renders no action menu when actions array is empty', () => {
    render(
      <SectionAccordion title="X" actions={[]}>
        <div>body</div>
      </SectionAccordion>,
    )

    expect(screen.queryByLabelText('actions')).not.toBeInTheDocument()
  })

  it('renders no action menu when every action is hidden', () => {
    render(
      <SectionAccordion
        title="X"
        actions={[
          { label: 'Edit', onClick: jest.fn(), hidden: true },
          { label: 'Delete', onClick: jest.fn(), hidden: true },
        ]}
      >
        <div>body</div>
      </SectionAccordion>,
    )

    expect(screen.queryByLabelText('actions')).not.toBeInTheDocument()
  })

  it('filters hidden actions from the menu and fires onClick of visible ones', async () => {
    const handleEdit = jest.fn()
    const handleDelete = jest.fn()

    render(
      <SectionAccordion
        title="X"
        actions={[
          { label: 'Edit', onClick: handleEdit },
          { label: 'Delete', onClick: handleDelete, hidden: true },
        ]}
      >
        <div>body</div>
      </SectionAccordion>,
    )

    await userEvent.click(screen.getByLabelText('actions'))

    expect(screen.getByText('Edit')).toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()

    await userEvent.click(screen.getByText('Edit'))

    expect(handleEdit).toHaveBeenCalledTimes(1)
    expect(handleDelete).not.toHaveBeenCalled()
  })
})
