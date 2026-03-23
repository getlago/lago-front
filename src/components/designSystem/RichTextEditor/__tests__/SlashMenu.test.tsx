import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { render } from '~/test-utils'

import type { SlashCommandItem } from '../extensions/SlashCommands'
import {
  SLASH_MENU_CONTAINER_TEST_ID,
  SLASH_MENU_ITEM_TEST_ID,
  SlashMenu,
  type SlashMenuRef,
} from '../SlashMenu'

const createMockItems = (): SlashCommandItem[] => [
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
        await act(() => render(<SlashMenu items={createMockItems()} command={mockCommand} />))

        expect(screen.getByTestId(SLASH_MENU_CONTAINER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render all items', async () => {
        await act(() => render(<SlashMenu items={createMockItems()} command={mockCommand} />))

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
        const items = createMockItems()

        await act(() => render(<SlashMenu items={items} command={mockCommand} />))

        await user.click(screen.getByTestId(`${SLASH_MENU_ITEM_TEST_ID}-1`))

        expect(mockCommand).toHaveBeenCalledWith(items[1])
      })
    })
  })

  describe('GIVEN keyboard navigation via ref', () => {
    const renderWithRef = async () => {
      const ref = createRef<SlashMenuRef>()
      const items = createMockItems()

      await act(() => render(<SlashMenu ref={ref} items={items} command={mockCommand} />))

      return { ref, items }
    }

    const simulateKeyDown = (ref: React.RefObject<SlashMenuRef | null>, key: string) => {
      return ref.current?.onKeyDown({
        event: new KeyboardEvent('keydown', { key }),
      } as unknown as Parameters<SlashMenuRef['onKeyDown']>[0])
    }

    describe('WHEN ArrowDown is pressed', () => {
      it('THEN should return true', async () => {
        const { ref } = await renderWithRef()

        let result: boolean | undefined

        act(() => {
          result = simulateKeyDown(ref, 'ArrowDown')
        })

        expect(result).toBe(true)
      })

      it('THEN should select the next item so Enter dispatches it', async () => {
        const { ref, items } = await renderWithRef()

        act(() => {
          simulateKeyDown(ref, 'ArrowDown')
        })
        act(() => {
          simulateKeyDown(ref, 'Enter')
        })

        expect(mockCommand).toHaveBeenCalledWith(items[1])
      })

      it('THEN should wrap around to the first item after the last', async () => {
        const { ref, items } = await renderWithRef()

        act(() => {
          simulateKeyDown(ref, 'ArrowDown')
        })
        act(() => {
          simulateKeyDown(ref, 'ArrowDown')
        })
        act(() => {
          simulateKeyDown(ref, 'ArrowDown')
        })
        act(() => {
          simulateKeyDown(ref, 'Enter')
        })

        expect(mockCommand).toHaveBeenCalledWith(items[0])
      })
    })

    describe('WHEN ArrowUp is pressed', () => {
      it('THEN should return true', async () => {
        const { ref } = await renderWithRef()

        let result: boolean | undefined

        act(() => {
          result = simulateKeyDown(ref, 'ArrowUp')
        })

        expect(result).toBe(true)
      })

      it('THEN should wrap to the last item from the first', async () => {
        const { ref, items } = await renderWithRef()

        act(() => {
          simulateKeyDown(ref, 'ArrowUp')
        })
        act(() => {
          simulateKeyDown(ref, 'Enter')
        })

        expect(mockCommand).toHaveBeenCalledWith(items[2])
      })
    })

    describe('WHEN Enter is pressed', () => {
      it('THEN should call command with the currently selected item and return true', async () => {
        const { ref, items } = await renderWithRef()

        let result: boolean | undefined

        act(() => {
          result = simulateKeyDown(ref, 'Enter')
        })

        expect(result).toBe(true)
        expect(mockCommand).toHaveBeenCalledWith(items[0])
      })
    })

    describe('WHEN an unhandled key is pressed', () => {
      it('THEN should return false', async () => {
        const { ref } = await renderWithRef()

        let result: boolean | undefined

        act(() => {
          result = simulateKeyDown(ref, 'Escape')
        })

        expect(result).toBe(false)
      })
    })
  })
})
