import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RefObject } from 'react'

import {
  FeeActionsCell,
  openViewFeeDetailsDrawer,
} from '~/components/invoices/details/FeeActionsCell'
import {
  FEE_ACTIONS_BUTTON_TEST_ID,
  FEE_ACTIONS_CELL_TEST_ID,
  FEE_COPY_ID_BUTTON_TEST_ID,
  FEE_VIEW_DETAILS_BUTTON_TEST_ID,
} from '~/components/invoices/details/invoiceDetailsTestIds'
import { ViewFeeDetailsDrawerRef } from '~/components/invoices/details/ViewFeeDetailsDrawer'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { FeeForViewFeeDetailsDrawerFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

const baseFee = {
  id: 'fee-123',
  amountCents: 10000,
  amountCurrency: 'USD',
  itemName: 'Test fee',
} as unknown as FeeForViewFeeDetailsDrawerFragment

const renderInTable = (ui: React.ReactNode) =>
  render(
    <table>
      <tbody>
        <tr>{ui}</tr>
      </tbody>
    </table>,
  )

describe('FeeActionsCell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a fee', () => {
    describe('WHEN the cell is rendered', () => {
      it('THEN should render the actions cell container', () => {
        renderInTable(<FeeActionsCell fee={baseFee} />)

        expect(screen.getByTestId(FEE_ACTIONS_CELL_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the dots-menu trigger button', () => {
        renderInTable(<FeeActionsCell fee={baseFee} />)

        expect(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should NOT render menu items until the trigger is clicked', () => {
        renderInTable(<FeeActionsCell fee={baseFee} />)

        expect(screen.queryByTestId(FEE_COPY_ID_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(FEE_VIEW_DETAILS_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN user opens the menu', () => {
      it.each([
        ['Copy fee ID', FEE_COPY_ID_BUTTON_TEST_ID],
        ['View fee details', FEE_VIEW_DETAILS_BUTTON_TEST_ID],
      ])('THEN should display the %s action', async (_, testId) => {
        const user = userEvent.setup()
        renderInTable(<FeeActionsCell fee={baseFee} />)

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))

        expect(await screen.findByTestId(testId)).toBeInTheDocument()
      })
    })

    describe('WHEN user clicks Copy fee ID', () => {
      it('THEN should copy the fee id to the clipboard', async () => {
        const user = userEvent.setup()
        renderInTable(<FeeActionsCell fee={baseFee} />)

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))
        await user.click(await screen.findByTestId(FEE_COPY_ID_BUTTON_TEST_ID))

        expect(copyToClipboard).toHaveBeenCalledWith('fee-123')
      })

      it('THEN should fire an info toast', async () => {
        const user = userEvent.setup()
        renderInTable(<FeeActionsCell fee={baseFee} />)

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))
        await user.click(await screen.findByTestId(FEE_COPY_ID_BUTTON_TEST_ID))

        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
      })
    })

    describe('WHEN user clicks View fee details', () => {
      it('THEN should open the drawer via the provided ref', async () => {
        const user = userEvent.setup()
        const openDrawer = jest.fn()
        const ref = {
          current: { openDrawer, closeDrawer: jest.fn() },
        } as unknown as RefObject<ViewFeeDetailsDrawerRef>

        renderInTable(<FeeActionsCell fee={baseFee} viewFeeDetailsDrawerRef={ref} />)

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))
        await user.click(await screen.findByTestId(FEE_VIEW_DETAILS_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(openDrawer).toHaveBeenCalledWith({ fee: baseFee })
        })
      })

      it('THEN should NOT throw when no drawer ref is provided', async () => {
        const user = userEvent.setup()
        renderInTable(<FeeActionsCell fee={baseFee} />)

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))

        await expect(
          user.click(await screen.findByTestId(FEE_VIEW_DETAILS_BUTTON_TEST_ID)),
        ).resolves.not.toThrow()
      })
    })

    describe('WHEN user clicks the cell', () => {
      it('THEN should stop propagation so the parent row click does not fire', async () => {
        const user = userEvent.setup()
        const rowClick = jest.fn()

        render(
          <table>
            <tbody>
              <tr onClick={rowClick}>
                <FeeActionsCell fee={baseFee} />
              </tr>
            </tbody>
          </table>,
        )

        await user.click(screen.getByTestId(FEE_ACTIONS_BUTTON_TEST_ID))

        expect(rowClick).not.toHaveBeenCalled()
      })
    })
  })
})

describe('openViewFeeDetailsDrawer', () => {
  describe('GIVEN a valid fee and ref', () => {
    it('WHEN called THEN should invoke ref.current.openDrawer with the fee', () => {
      const openDrawer = jest.fn()
      const ref = {
        current: { openDrawer, closeDrawer: jest.fn() },
      } as unknown as RefObject<ViewFeeDetailsDrawerRef>

      openViewFeeDetailsDrawer(baseFee, ref)

      expect(openDrawer).toHaveBeenCalledWith({ fee: baseFee })
    })
  })

  describe('GIVEN a null fee', () => {
    it('WHEN called THEN should NOT invoke openDrawer', () => {
      const openDrawer = jest.fn()
      const ref = {
        current: { openDrawer, closeDrawer: jest.fn() },
      } as unknown as RefObject<ViewFeeDetailsDrawerRef>

      openViewFeeDetailsDrawer(null, ref)

      expect(openDrawer).not.toHaveBeenCalled()
    })
  })

  describe('GIVEN a null ref', () => {
    it('WHEN called THEN should NOT throw', () => {
      expect(() => openViewFeeDetailsDrawer(baseFee, undefined)).not.toThrow()
    })
  })

  describe('GIVEN a ref with null current', () => {
    it('WHEN called THEN should NOT throw', () => {
      const ref = { current: null } as RefObject<ViewFeeDetailsDrawerRef>

      expect(() => openViewFeeDetailsDrawer(baseFee, ref)).not.toThrow()
    })
  })
})
