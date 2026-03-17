import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { ActionsBlock } from '../ActionRenderer'
import { ACTIONS_BLOCK_TEST_ID } from '../mainHeaderTestIds'
import { MainHeaderAction } from '../types'

describe('ActionsBlock', () => {
  describe('GIVEN isLoading is true', () => {
    describe('WHEN the component renders', () => {
      it('THEN should not render the actions container', () => {
        const { container } = render(<ActionsBlock isLoading={true} />)

        expect(screen.queryByTestId(ACTIONS_BLOCK_TEST_ID)).not.toBeInTheDocument()
        // Skeleton should be rendered (an animate-pulse div)
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no actions are provided', () => {
    describe('WHEN actions is undefined', () => {
      it('THEN should render nothing', () => {
        const { container } = render(<ActionsBlock />)

        expect(container.innerHTML).toBe('')
      })
    })

    describe('WHEN actions is an empty array', () => {
      it('THEN should render nothing', () => {
        const { container } = render(<ActionsBlock actions={[]} />)

        expect(container.innerHTML).toBe('')
      })
    })
  })

  describe('GIVEN actions of type "action" are provided', () => {
    const onClick = jest.fn()
    const actions: MainHeaderAction[] = [
      {
        type: 'action',
        label: 'Edit',
        onClick,
        dataTest: 'edit-button',
      },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should display the actions container', () => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId(ACTIONS_BLOCK_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should display the action button', () => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId('edit-button')).toBeInTheDocument()
      })
    })

    describe('WHEN the action button is clicked', () => {
      it('THEN should call the onClick handler', async () => {
        const user = userEvent.setup()

        render(<ActionsBlock actions={actions} />)

        await user.click(screen.getByTestId('edit-button'))

        expect(onClick).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN an action with variant and startIcon', () => {
    const actions: MainHeaderAction[] = [
      {
        type: 'action',
        label: 'Add',
        onClick: jest.fn(),
        variant: 'primary',
        startIcon: 'plus',
        dataTest: 'add-button',
      },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should render the button with the correct data-test', () => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId('add-button')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a disabled action', () => {
    const actions: MainHeaderAction[] = [
      {
        type: 'action',
        label: 'Disabled Action',
        onClick: jest.fn(),
        disabled: true,
        dataTest: 'disabled-button',
      },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should render a disabled button', () => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId('disabled-button')).toBeDisabled()
      })
    })
  })

  describe('GIVEN a dropdown action', () => {
    const onItemClick = jest.fn()
    const actions: MainHeaderAction[] = [
      {
        type: 'dropdown',
        label: 'More actions',
        dataTest: 'dropdown-trigger',
        items: [
          {
            label: 'Delete',
            onClick: onItemClick,
            danger: true,
            dataTest: 'delete-item',
          },
          {
            label: 'Hidden item',
            onClick: jest.fn(),
            hidden: true,
          },
        ],
      },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should display the dropdown trigger button', () => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
      })
    })

    describe('WHEN the dropdown trigger is clicked', () => {
      it('THEN should show visible items and hide hidden items', async () => {
        const user = userEvent.setup()

        render(<ActionsBlock actions={actions} />)

        await user.click(screen.getByTestId('dropdown-trigger'))

        expect(screen.getByTestId('delete-item')).toBeInTheDocument()
        expect(screen.queryByText('Hidden item')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a dropdown where all items are hidden', () => {
    const actions: MainHeaderAction[] = [
      {
        type: 'dropdown',
        label: 'Empty Dropdown',
        items: [
          { label: 'Hidden 1', onClick: jest.fn(), hidden: true },
          { label: 'Hidden 2', onClick: jest.fn(), hidden: true },
        ],
      },
    ]

    describe('WHEN the component renders', () => {
      it('THEN should render nothing for that action', () => {
        const { container } = render(<ActionsBlock actions={actions} />)

        // The dropdown with all hidden items returns null, but the container div still renders
        expect(container.querySelector('[data-test="actions-block"]')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple actions of different types', () => {
    const actions: MainHeaderAction[] = [
      {
        type: 'action',
        label: 'Save',
        onClick: jest.fn(),
        dataTest: 'save-button',
      },
      {
        type: 'action',
        label: 'Cancel',
        onClick: jest.fn(),
        variant: 'quaternary',
        dataTest: 'cancel-button',
      },
    ]

    describe('WHEN the component renders', () => {
      it.each([
        ['save button', 'save-button'],
        ['cancel button', 'cancel-button'],
      ])('THEN should display the %s', (_, testId) => {
        render(<ActionsBlock actions={actions} />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })
    })
  })
})
