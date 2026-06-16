import { act, configure, render, screen } from '@testing-library/react'

configure({ testIdAttribute: 'data-test' })
import userEvent from '@testing-library/user-event'

import type { QuotePreviewProps } from '../buildQuotePreviewProps'
import { QuotePdfProvider, useDownloadQuotePdf } from '../QuotePdfProvider'

let capturedEditorProps: Record<string, unknown> = {}

jest.mock('~/components/designSystem/RichTextEditor/RichTextEditor', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedEditorProps = props

    return <div data-test="hidden-preview" />
  },
}))

jest.mock('~/components/designSystem/RichTextEditor/common/printHtmlContent', () => ({
  printHtmlContent: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const { printHtmlContent } = jest.requireMock(
  '~/components/designSystem/RichTextEditor/common/printHtmlContent',
)
const { addToast } = jest.requireMock('~/core/apolloClient')

const PROPS: QuotePreviewProps = {
  content: '<p>Doc</p>',
  entities: { 'addon-1': { entityId: 'addon-1', entityType: 'addOn', name: 'A', code: 'a' } },
  customerLocale: 'en',
  customerCurrency: undefined,
  mentionValues: {},
}

const Consumer = ({ props }: { props: QuotePreviewProps }) => {
  const { download } = useDownloadQuotePdf()

  return (
    <button data-test="trigger" onClick={() => download(props)}>
      download
    </button>
  )
}

describe('QuotePdfProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedEditorProps = {}
  })

  it('renders the preview off-screen and prints the serialized HTML on ready', async () => {
    render(
      <QuotePdfProvider>
        <Consumer props={PROPS} />
      </QuotePdfProvider>,
    )

    await userEvent.click(screen.getByTestId('trigger'))

    expect(screen.getByTestId('hidden-preview')).toBeInTheDocument()
    expect(capturedEditorProps.mode).toBe('preview')
    expect(capturedEditorProps.content).toBe('<p>Doc</p>')
    expect(capturedEditorProps.entities).toEqual(PROPS.entities)

    act(() => {
      ;(capturedEditorProps.onPreviewReady as (html: string) => void)('<p>rendered</p>')
    })

    expect(printHtmlContent).toHaveBeenCalledWith(
      '<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false"><p>rendered</p></div></div>',
    )
  })

  it('no-ops on empty content', async () => {
    render(
      <QuotePdfProvider>
        <Consumer props={{ ...PROPS, content: '' }} />
      </QuotePdfProvider>,
    )

    await userEvent.click(screen.getByTestId('trigger'))

    expect(screen.queryByTestId('hidden-preview')).not.toBeInTheDocument()
    expect(printHtmlContent).not.toHaveBeenCalled()
  })

  it('shows an error toast and tears down the preview on timeout', () => {
    jest.useFakeTimers()

    try {
      render(
        <QuotePdfProvider>
          <Consumer props={PROPS} />
        </QuotePdfProvider>,
      )

      act(() => {
        screen.getByTestId('trigger').click()
      })

      expect(screen.getByTestId('hidden-preview')).toBeInTheDocument()

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        translateKey: 'text_62b31e1f6a5b8b1b745ece48',
      })
      expect(screen.queryByTestId('hidden-preview')).not.toBeInTheDocument()
      expect(printHtmlContent).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it('throws when used outside the provider', () => {
    const Outside = () => {
      useDownloadQuotePdf()

      return null
    }

    expect(() => render(<Outside />)).toThrow('useDownloadQuotePdf must be used within a QuotePdfProvider')
  })

  it('queues a second download and renders it after the first completes', async () => {
    const Multi = () => {
      const { download } = useDownloadQuotePdf()

      return (
        <>
          <button data-test="dl-a" onClick={() => download({ ...PROPS, content: '<p>A</p>' })}>
            A
          </button>
          <button data-test="dl-b" onClick={() => download({ ...PROPS, content: '<p>B</p>' })}>
            B
          </button>
        </>
      )
    }

    render(
      <QuotePdfProvider>
        <Multi />
      </QuotePdfProvider>,
    )

    await userEvent.click(screen.getByTestId('dl-a'))
    await userEvent.click(screen.getByTestId('dl-b'))

    // A is in flight, B is queued
    expect(capturedEditorProps.content).toBe('<p>A</p>')

    act(() => {
      ;(capturedEditorProps.onPreviewReady as (html: string) => void)('<p>A-rendered</p>')
    })

    expect(printHtmlContent).toHaveBeenNthCalledWith(
      1,
      '<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false"><p>A-rendered</p></div></div>',
    )

    // B is now in flight
    expect(capturedEditorProps.content).toBe('<p>B</p>')

    act(() => {
      ;(capturedEditorProps.onPreviewReady as (html: string) => void)('<p>B-rendered</p>')
    })

    expect(printHtmlContent).toHaveBeenNthCalledWith(
      2,
      '<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false"><p>B-rendered</p></div></div>',
    )
  })
})
