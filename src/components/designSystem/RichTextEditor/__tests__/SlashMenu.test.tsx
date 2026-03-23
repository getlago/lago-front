import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import type { SlashCommandItem } from '../extensions/SlashCommands'
import { SLASH_MENU_CONTAINER_TEST_ID, SLASH_MENU_ITEM_TEST_ID, SlashMenu } from '../SlashMenu'

const mockItems: SlashCommandItem[] = [
  { title: 'Heading 1', description: 'Large heading', command: jest.fn() },
  { title: 'Bullet List', description: 'Unordered list', command: jest.fn() },
  { title: 'Code Block', description: 'Code block', command: jest.fn() },
]

const mockCommand = jest.fn()

describe('SlashMenu', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the menu receives items', () => {
    describe('WHEN items are provided', () => {
      it('THEN should render the menu container', async () => {
        await act(() => render(<SlashMenu items={mockItems} command={mockCommand} />))

        expect(screen.getByTestId(SLASH_MENU_CONTAINER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render all items', async () => {
        await act(() => render(<SlashMenu items={mockItems} command={mockCommand} />))

        expect(screen.getByTestId(`${SLASH_MENU_ITEM_TEST_ID}-0`)).toBeInTheDocument()
        expect(screen.getByTestId(`${SLASH_MENU_ITEM_TEST_ID}-1`)).toBeInTheDocument()
        expect(screen.getByTestId(`${SLASH_MENU_ITEM_TEST_ID}-2`)).toBeInTheDocument()
      })
    })

    describe('WHEN items array is empty', () => {
      it('THEN should not render the menu', async () => {
        await act(() => render(<SlashMenu items={[]} command={mockCommand} />))

        expect(screen.queryByTestId(SLASH_MENU_CONTAINER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user clicks on an item', () => {
    describe('WHEN an item is clicked', () => {
      it('THEN should call command with the clicked item', async () => {
        const user = userEvent.setup()

        await act(() => render(<SlashMenu items={mockItems} command={mockCommand} />))

        await user.click(screen.getByTestId(`${SLASH_MENU_ITEM_TEST_ID}-1`))

        expect(mockCommand).toHaveBeenCalledWith(mockItems[1])
      })
    })
  })
})
