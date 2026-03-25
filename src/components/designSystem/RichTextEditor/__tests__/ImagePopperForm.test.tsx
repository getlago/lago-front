import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Editor } from '@tiptap/react'

import { render } from '~/test-utils'

import ImagePopperForm, {
  TOOLBAR_IMAGE_INPUT_TEST_ID,
  TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID,
} from '../ImagePopperForm'

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

const createMockEditor = () => {
  const { proxy, runMock } = createMockChain()

  return {
    editor: {
      isActive: jest.fn(() => false),
      chain: jest.fn().mockReturnValue(proxy),
    } as unknown as Editor,
    runMock,
  }
}

describe('ImagePopperForm', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('should render the image URL input and Insert button', async () => {
    const { editor } = createMockEditor()
    const closePopper = jest.fn()

    await act(() => render(<ImagePopperForm editor={editor} closePopper={closePopper} />))

    expect(screen.getByTestId(TOOLBAR_IMAGE_INPUT_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID)).toBeInTheDocument()
  })

  describe('WHEN entering a URL and clicking Insert', () => {
    it('should call editor chain to insert the image', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<ImagePopperForm editor={editor} closePopper={closePopper} />))

      await user.type(
        screen.getByTestId(TOOLBAR_IMAGE_INPUT_TEST_ID),
        'https://example.com/image.png',
      )
      await user.click(screen.getByTestId(TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
        expect(closePopper).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN pressing Enter in the input', () => {
    it('should submit the form', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<ImagePopperForm editor={editor} closePopper={closePopper} />))

      await user.type(
        screen.getByTestId(TOOLBAR_IMAGE_INPUT_TEST_ID),
        'https://example.com/photo.jpg{Enter}',
      )

      await waitFor(() => {
        expect(editor.chain).toHaveBeenCalled()
        expect(runMock).toHaveBeenCalled()
      })
    })
  })

  describe('WHEN clicking Insert with empty input', () => {
    it('should not call setImage', async () => {
      const user = userEvent.setup()
      const { editor, runMock } = createMockEditor()
      const closePopper = jest.fn()

      await act(() => render(<ImagePopperForm editor={editor} closePopper={closePopper} />))

      await user.click(screen.getByTestId(TOOLBAR_IMAGE_INSERT_BUTTON_TEST_ID))

      await waitFor(() => {
        expect(closePopper).toHaveBeenCalled()
      })

      expect(runMock).not.toHaveBeenCalled()
    })
  })
})
