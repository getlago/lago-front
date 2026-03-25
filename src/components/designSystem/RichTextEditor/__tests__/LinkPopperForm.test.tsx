import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'

import { render } from '~/test-utils'

import LinkPopperForm, {
  TOOLBAR_LINK_APPLY_BUTTON_TEST_ID,
  TOOLBAR_LINK_INPUT_TEST_ID,
  TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID,
} from '../LinkPopperForm'

const createMockChain = () => {
  const chainMethods: Record<string, jest.Mock> = {}
  const runMock = jest.fn()

  const handler: ProxyHandler<Record<string, jest.Mock>> = {
    get: (_target, prop: string) => {
      if (prop === 'run') return runMock
      if (!chainMethods[prop]) {
        chainMethods[prop] = jest.fn().mockReturnValue(new Proxy({}, handler))
      }

      return chainMethods[prop]
    },
  }

  return { proxy: new Proxy({}, handler), runMock, chainMethods }
}

const createMockEditor = (overrides: Record<string, boolean> = {}) => {
  const { proxy, runMock, chainMethods } = createMockChain()

  return {
    editor: {
      isActive: jest.fn((type: string) => overrides[type] ?? false),
      chain: jest.fn().mockReturnValue(proxy),
    } as unknown as Editor,
    runMock,
    chainMethods,
  }
}

describe('LinkPopperForm', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('should render the URL input and Apply button', async () => {
    const { editor } = createMockEditor()
    const closePopper = jest.fn()

    await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

    expect(screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(TOOLBAR_LINK_APPLY_BUTTON_TEST_ID)).toBeInTheDocument()
  })

  describe('WHEN entering a URL with http and clicking Apply', () => {
    it('should call editor chain with the URL', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      await user.type(screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID), 'https://example.com')
      await user.click(screen.getByTestId(TOOLBAR_LINK_APPLY_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
        expect(closePopper).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN entering a URL without http and clicking Apply', () => {
    it('should prepend https://', async () => {
      const user = userEvent.setup()
      const { editor, runMock, chainMethods } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      await user.type(screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID), 'example.com')
      await user.click(screen.getByTestId(TOOLBAR_LINK_APPLY_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(chainMethods.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
        expect(runMock).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN clicking Apply with empty input', () => {
    it('should call unsetLink', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      await user.click(screen.getByTestId(TOOLBAR_LINK_APPLY_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN pressing Enter in the input', () => {
    it('should submit the form', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      await user.type(screen.getByTestId(TOOLBAR_LINK_INPUT_TEST_ID), 'https://test.com{Enter}')

      await waitFor(() => {
        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN link is active', () => {
    it('should show the Remove button', async () => {
      const { editor } = createMockEditor({ link: true })
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      expect(screen.getByTestId(TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID)).toBeInTheDocument()
    })

    it('should call unsetLink and closePopper when Remove is clicked', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor({ link: true })
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      await user.click(screen.getByTestId(TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID))

      expect(editor.chain).toHaveBeenCalled()
      expect(runMock).toHaveBeenCalled()
      expect(closePopper).toHaveBeenCalled()
    })
  })

  describe('WHEN link is not active', () => {
    it('should not show the Remove button', async () => {
      const { editor } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<LinkPopperForm editor={editor} closePopper={closePopper} />))

      expect(screen.queryByTestId(TOOLBAR_LINK_REMOVE_BUTTON_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
