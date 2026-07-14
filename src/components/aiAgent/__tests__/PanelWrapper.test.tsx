import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PANEL_WRAPPER_TITLE_TEST_ID, PanelWrapper } from '~/components/aiAgent/PanelWrapper'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockClosePanel = jest.fn()

jest.mock('~/hooks/aiAgent/useAiAgent', () => ({
  ...jest.requireActual('~/hooks/aiAgent/useAiAgent'),
  useAiAgent: () => ({
    closePanel: mockClosePanel,
  }),
}))

const getIconButton = (iconTestId: string) =>
  screen.queryByTestId(iconTestId)?.closest('button') as HTMLButtonElement | undefined

const defaultProps = {
  title: 'My conversation',
  isBeta: false,
}

describe('PanelWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a title', () => {
    describe('WHEN the component renders', () => {
      it('THEN should display the title', () => {
        render(<PanelWrapper {...defaultProps}>content</PanelWrapper>)

        expect(screen.getByTestId(PANEL_WRAPPER_TITLE_TEST_ID)).toHaveTextContent('My conversation')
      })

      it('THEN should display the children', () => {
        render(<PanelWrapper {...defaultProps}>content</PanelWrapper>)

        expect(screen.getByText('content')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the back button', () => {
    describe('WHEN showBackButton is false', () => {
      it('THEN should not display it', () => {
        render(<PanelWrapper {...defaultProps}>content</PanelWrapper>)

        expect(getIconButton('arrow-left/medium')).toBeUndefined()
      })
    })

    describe('WHEN clicking it', () => {
      it('THEN should call the back handler', async () => {
        const onBackButton = jest.fn()

        render(
          <PanelWrapper {...defaultProps} showBackButton onBackButton={onBackButton}>
            content
          </PanelWrapper>,
        )

        await userEvent.click(getIconButton('arrow-left/medium') as HTMLButtonElement)

        expect(onBackButton).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the history button', () => {
    describe('WHEN showHistoryButton is false', () => {
      it('THEN should not display it', () => {
        render(<PanelWrapper {...defaultProps}>content</PanelWrapper>)

        expect(getIconButton('history/medium')).toBeUndefined()
      })
    })

    describe('WHEN clicking it', () => {
      it('THEN should open the history view', async () => {
        const onShowHistory = jest.fn()

        render(
          <PanelWrapper {...defaultProps} showHistoryButton onShowHistory={onShowHistory}>
            content
          </PanelWrapper>,
        )

        await userEvent.click(getIconButton('history/medium') as HTMLButtonElement)

        expect(onShowHistory).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the fullscreen button', () => {
    describe('WHEN not in fullscreen', () => {
      it('THEN should display the expand icon and toggle on click', async () => {
        const onFullscreen = jest.fn()

        render(
          <PanelWrapper {...defaultProps} onFullscreen={onFullscreen}>
            content
          </PanelWrapper>,
        )

        await userEvent.click(getIconButton('resize-expand/medium') as HTMLButtonElement)

        expect(onFullscreen).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN in fullscreen', () => {
      it('THEN should display the reduce icon', () => {
        render(
          <PanelWrapper {...defaultProps} onFullscreen={jest.fn()} isFullscreen>
            content
          </PanelWrapper>,
        )

        expect(getIconButton('resize-reduce/medium')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the close button', () => {
    describe('WHEN not in fullscreen', () => {
      it('THEN should only close the panel', async () => {
        const onFullscreen = jest.fn()

        render(
          <PanelWrapper {...defaultProps} onFullscreen={onFullscreen}>
            content
          </PanelWrapper>,
        )

        await userEvent.click(getIconButton('close/medium') as HTMLButtonElement)

        expect(mockClosePanel).toHaveBeenCalledTimes(1)
        expect(onFullscreen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN in fullscreen', () => {
      it('THEN should exit fullscreen before closing the panel', async () => {
        const onFullscreen = jest.fn()

        render(
          <PanelWrapper {...defaultProps} onFullscreen={onFullscreen} isFullscreen>
            content
          </PanelWrapper>,
        )

        await userEvent.click(getIconButton('close/medium') as HTMLButtonElement)

        expect(onFullscreen).toHaveBeenCalledTimes(1)
        expect(mockClosePanel).toHaveBeenCalledTimes(1)
      })
    })
  })
})
