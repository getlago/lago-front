import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { WarningDialog } from '~/components/WarningDialog'
import { render } from '~/test-utils'

const onContinueMock = jest.fn()

async function prepare() {
  await act(() =>
    render(
      <WarningDialog
        forceOpen
        title="title"
        description="description"
        continueText="continueText"
        onContinue={onContinueMock}
      />,
    ),
  )
}

describe('WarningDialog', () => {
  afterEach(cleanup)

  it('renders', async () => {
    await prepare()

    expect(screen.queryByTestId('warning-dialog')).toBeInTheDocument()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('continueText')).toBeInTheDocument()
  })

  it('should trigger the confirm action on click', async () => {
    await prepare()

    expect(onContinueMock).not.toHaveBeenCalled()

    await waitFor(() => userEvent.click(screen.queryByTestId('warning-confirm') as HTMLElement))

    expect(onContinueMock).toHaveBeenCalled()
  })
})
