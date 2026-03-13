import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  BASE_DRAWER_ACTIONS_TEST_ID,
  BASE_DRAWER_BACKDROP_TEST_ID,
  BASE_DRAWER_CONTENT_TEST_ID,
  BASE_DRAWER_HEADER_TEST_ID,
  BASE_DRAWER_TEST_ID,
  BaseDrawer,
  BaseDrawerProps,
} from '../BaseDrawer'
import { drawerStack } from '../drawerStack'

jest.mock('../drawerStack')

// Mock rAF to fire synchronously so the drawer transitions to 'open' state
beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0)

    return 0
  })
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()

  // Clean up drawer stack
  const snapshot = drawerStack.getSnapshot()

  snapshot.forEach((id) => drawerStack.remove(id))
})

const defaultProps: BaseDrawerProps = {
  isOpen: true,
  title: 'Test Drawer',
  children: <div>Drawer content</div>,
  onClose: jest.fn(),
}

describe('BaseDrawer', () => {
  describe('GIVEN the drawer is open', () => {
    describe('WHEN rendered with required props', () => {
      it.each([
        ['container', BASE_DRAWER_TEST_ID],
        ['header', BASE_DRAWER_HEADER_TEST_ID],
        ['content area', BASE_DRAWER_CONTENT_TEST_ID],
        ['backdrop', BASE_DRAWER_BACKDROP_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        render(<BaseDrawer {...defaultProps} />)

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should render a dialog element', () => {
        render(<BaseDrawer {...defaultProps} />)

        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      it('THEN should render the title text', () => {
        render(<BaseDrawer {...defaultProps} />)

        const header = screen.getByTestId(BASE_DRAWER_HEADER_TEST_ID)

        expect(header).toHaveTextContent('Test Drawer')
      })

      it('THEN should render children content', () => {
        render(<BaseDrawer {...defaultProps} />)

        const content = screen.getByTestId(BASE_DRAWER_CONTENT_TEST_ID)

        expect(content).toHaveTextContent('Drawer content')
      })
    })

    describe('WHEN actions are provided', () => {
      it('THEN should display the actions bar', () => {
        render(<BaseDrawer {...defaultProps} actions={<button>Save</button>} />)

        expect(screen.getByTestId(BASE_DRAWER_ACTIONS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN no actions are provided', () => {
      it('THEN should not display the actions bar', () => {
        render(<BaseDrawer {...defaultProps} />)

        expect(screen.queryByTestId(BASE_DRAWER_ACTIONS_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the drawer is closed', () => {
    describe('WHEN isOpen is false', () => {
      it('THEN should not render anything', () => {
        render(<BaseDrawer {...defaultProps} isOpen={false} />)

        expect(screen.queryByTestId(BASE_DRAWER_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the drawer receives a ReactNode title', () => {
    describe('WHEN a custom element is passed as title', () => {
      it('THEN should render the custom title element', () => {
        render(
          <BaseDrawer
            {...defaultProps}
            title={<span data-test="custom-title">Custom Title</span>}
          />,
        )

        expect(screen.getByTestId('custom-title')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user interacts with the drawer', () => {
    describe('WHEN the ESC key is pressed', () => {
      it('THEN should call onClose', async () => {
        const onClose = jest.fn()
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        render(<BaseDrawer {...defaultProps} onClose={onClose} />)

        await user.keyboard('{Escape}')

        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the backdrop is clicked', () => {
      it('THEN should call onClose', async () => {
        const onClose = jest.fn()
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

        render(<BaseDrawer {...defaultProps} onClose={onClose} />)

        const backdrop = screen.getByTestId(BASE_DRAWER_BACKDROP_TEST_ID)

        await user.click(backdrop)

        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN a form prop is provided', () => {
    describe('WHEN the drawer has a form', () => {
      it('THEN should wrap content in a form element', () => {
        const submit = jest.fn()

        render(<BaseDrawer {...defaultProps} form={{ id: 'test-form', submit }} />)

        const form = document.getElementById('test-form') as HTMLFormElement

        expect(form).toBeInTheDocument()
        expect(form.tagName).toBe('FORM')
      })

      it('THEN should call form.submit on form submission', () => {
        const submit = jest.fn()

        render(
          <BaseDrawer
            {...defaultProps}
            form={{ id: 'test-form', submit }}
            actions={<button type="submit">Submit</button>}
          />,
        )

        const form = document.getElementById('test-form') as HTMLFormElement

        act(() => {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        })

        expect(submit).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer is closing', () => {
    describe('WHEN isOpen changes to false after being open', () => {
      it('THEN should call onExited after the transition', async () => {
        const onExited = jest.fn()

        const { rerender } = render(<BaseDrawer {...defaultProps} onExited={onExited} />)

        // Drawer is open, now close it
        rerender(<BaseDrawer {...defaultProps} isOpen={false} onExited={onExited} />)

        // Advance past the fallback timeout (DRAWER_TRANSITION_DURATION + 100)
        act(() => {
          jest.advanceTimersByTime(500)
        })

        await waitFor(() => {
          expect(onExited).toHaveBeenCalled()
        })
      })
    })
  })
})
