import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import { render } from '~/test-utils'

import { ReasonModal } from '../ReasonModal'

const mockModal = {
  visible: true,
  resolve: jest.fn(),
  reject: jest.fn(),
  hide: jest.fn(),
  remove: jest.fn(),
}

jest.mock('@ebay/nice-modal-react', () => ({
  ...jest.requireActual('@ebay/nice-modal-react'),
  create: (component: unknown) => component,
  useModal: () => mockModal,
}))

const reason = 'Customer requested upgrade'

describe('ReasonModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('validates trimmed length and passes the reason and notification choice', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)

    render(
      <ReasonModal
        id="reason-modal-test"
        title="Update feature"
        description="Explain this change"
        onConfirm={onConfirm}
      />,
    )
    const input = screen.getByRole('textbox')
    const confirm = screen.getByRole('button', { name: 'Confirm' })

    for (const value of ['', '          ', 'short', 'x'.repeat(501)]) {
      fireEvent.change(input, { target: { value } })
      expect(confirm).toBeDisabled()
    }
    fireEvent.change(input, { target: { value: `  ${reason}  ` } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(confirm)
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(reason, true))
    expect(mockModal.resolve).toHaveBeenCalledWith({ reason: 'success' })
    expect(mockModal.hide).toHaveBeenCalledTimes(1)
  })

  it('prevents repeated submission while the mutation is pending', async () => {
    let finish: () => void = () => undefined
    const onConfirm = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )

    render(
      <ReasonModal
        id="reason-modal-test"
        title="Update feature"
        description="Explain"
        onConfirm={onConfirm}
        showNotifyCheckbox={false}
      />,
    )
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: reason } })
    const confirm = screen.getByRole('button', { name: 'Confirm' })

    fireEvent.click(confirm)
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await act(async () => finish())
  })

  it('keeps the reason available for retry after a failed mutation', async () => {
    const onConfirm = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(undefined)

    render(
      <ReasonModal
        id="reason-modal-test"
        title="Update feature"
        description="Explain"
        onConfirm={onConfirm}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: reason } })
    const confirm = screen.getByRole('button', { name: 'Confirm' })

    fireEvent.click(confirm)
    await waitFor(() => expect(confirm).toBeEnabled())
    expect(screen.getByRole('textbox')).toHaveValue(reason)
    expect(mockModal.reject).not.toHaveBeenCalled()
    expect(mockModal.hide).not.toHaveBeenCalled()
    fireEvent.click(confirm)
    await waitFor(() => expect(mockModal.hide).toHaveBeenCalledTimes(1))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('cancels without submitting', () => {
    const onConfirm = jest.fn()

    render(
      <ReasonModal
        id="reason-modal-test"
        title="Update feature"
        description="Explain"
        onConfirm={onConfirm}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    expect(mockModal.hide).toHaveBeenCalledTimes(1)
    expect(mockModal.resolve).toHaveBeenCalled()
  })
})
