import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { DeleteAdjustedFeeDialogRef } from '~/components/invoices/details/DeleteAdjustedFeeDialog'
import { EditFeeDrawerRef } from '~/components/invoices/details/EditFeeDrawer'
import { InvoiceDetailsTable } from '~/components/invoices/details/InvoiceDetailsTable'
import {
  FEE_ACTIONS_BUTTON_TEST_ID,
  FEE_ACTIONS_CELL_TEST_ID,
  FEE_ROW_TEST_ID_PREFIX,
} from '~/components/invoices/details/invoiceDetailsTestIds'
import { ViewFeeDetailsDrawerRef } from '~/components/invoices/details/ViewFeeDetailsDrawer'
import {
  ChargeModelEnum,
  CurrencyEnum,
  FeeDetailsForInvoiceOverviewFragment,
  FeeTypesEnum,
  InvoiceForDetailsTableFragment,
  InvoiceStatusTypeEnum,
  InvoiceTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

// Menu interactions (open menu, click Copy fee ID, click View details) are
// covered by FeeActionsCell.test.tsx in isolation. This integration suite focuses
// on row-level wiring: data-test ids, the action cell being rendered on every
// row, and the row click handler invoking the drawer with the correct fee.

const buildFinalizedInvoice = (): InvoiceForDetailsTableFragment =>
  ({
    id: 'invoice-1',
    invoiceType: InvoiceTypeEnum.Subscription,
    status: InvoiceStatusTypeEnum.Finalized,
    subTotalExcludingTaxesAmountCents: '10000',
    subTotalIncludingTaxesAmountCents: '11000',
    totalAmountCents: '11000',
    currency: CurrencyEnum.Usd,
    issuingDate: '2026-05-01',
    allChargesHaveFees: true,
    allFixedChargesHaveFees: true,
    versionNumber: 4,
    fees: [
      {
        id: 'fee-charge-1',
        amountCents: '5000',
        currency: CurrencyEnum.Usd,
        feeType: FeeTypesEnum.Charge,
        invoiceDisplayName: null,
        invoiceName: 'API Calls',
        itemName: 'API Calls',
        units: 100,
        preciseUnitAmount: '50',
        charge: {
          id: 'charge-1',
          payInAdvance: false,
          chargeModel: ChargeModelEnum.Standard,
          billableMetric: {
            id: 'metric-1',
            name: 'API Calls',
            recurring: false,
          },
        },
        subscription: { id: 'sub-1' },
        properties: {
          fromDatetime: '2026-05-01T00:00:00Z',
          toDatetime: '2026-05-31T23:59:59Z',
        },
      },
    ] as unknown as FeeDetailsForInvoiceOverviewFragment[],
    subscriptions: [
      {
        id: 'sub-1',
        name: 'Main Subscription',
        currentBillingPeriodStartedAt: '2026-05-01T00:00:00Z',
        currentBillingPeriodEndingAt: '2026-05-31T23:59:59Z',
        plan: { id: 'plan-1', name: 'Premium Plan', interval: 'monthly' },
      },
    ],
    invoiceSubscriptions: [
      {
        subscription: { id: 'sub-1' },
        invoice: { id: 'invoice-1' },
        acceptNewChargeFees: true,
      },
    ],
  }) as unknown as InvoiceForDetailsTableFragment

const renderTable = (
  invoice: InvoiceForDetailsTableFragment,
  viewFeeDetailsDrawerRef: React.RefObject<ViewFeeDetailsDrawerRef>,
) =>
  render(
    <InvoiceDetailsTable
      customer={{ id: 'customer-1', applicableTimezone: TimezoneEnum.TzAmericaNewYork }}
      invoice={invoice}
      editFeeDrawerRef={{ current: null } as unknown as React.RefObject<EditFeeDrawerRef>}
      viewFeeDetailsDrawerRef={viewFeeDetailsDrawerRef}
      deleteAdjustedFeeDialogRef={
        { current: null } as unknown as React.RefObject<DeleteAdjustedFeeDialogRef>
      }
      fees={invoice.fees as FeeDetailsForInvoiceOverviewFragment[]}
    />,
  )

describe('InvoiceDetailsTableBodyLine — clickable rows + action menu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a finalized invoice with a fee', () => {
    describe('WHEN the table renders', () => {
      it('THEN should render the fee row with a deterministic data-test id', () => {
        const ref = createRef<ViewFeeDetailsDrawerRef>()
        renderTable(buildFinalizedInvoice(), ref)

        expect(screen.getByTestId(`${FEE_ROW_TEST_ID_PREFIX}-fee-charge-1`)).toBeInTheDocument()
      })

      it('THEN should render the 3-dots actions cell on the fee row', () => {
        const ref = createRef<ViewFeeDetailsDrawerRef>()
        renderTable(buildFinalizedInvoice(), ref)

        expect(screen.getAllByTestId(FEE_ACTIONS_CELL_TEST_ID).length).toBeGreaterThan(0)
        expect(screen.getAllByTestId(FEE_ACTIONS_BUTTON_TEST_ID).length).toBeGreaterThan(0)
      })
    })

    describe('WHEN user clicks the fee row', () => {
      it('THEN should open the view-fee-details drawer with the row fee', async () => {
        const user = userEvent.setup()
        const openDrawer = jest.fn()
        const ref = {
          current: { openDrawer, closeDrawer: jest.fn() },
        } as unknown as React.RefObject<ViewFeeDetailsDrawerRef>

        renderTable(buildFinalizedInvoice(), ref)

        await user.click(screen.getByTestId(`${FEE_ROW_TEST_ID_PREFIX}-fee-charge-1`))

        expect(openDrawer).toHaveBeenCalledTimes(1)
        expect(openDrawer).toHaveBeenCalledWith(
          expect.objectContaining({ fee: expect.objectContaining({ id: 'fee-charge-1' }) }),
        )
      })
    })

    describe('WHEN multiple rows render (fee + subtotal + pricing-unit subtotal)', () => {
      it('THEN each row should have its own 3-dots actions cell', () => {
        const ref = createRef<ViewFeeDetailsDrawerRef>()
        renderTable(buildFinalizedInvoice(), ref)

        // One per fee row at minimum. Each FeeActionsCell renders the dots
        // button so menu/copy actions are reachable on every row.
        const actionCells = screen.getAllByTestId(FEE_ACTIONS_CELL_TEST_ID)
        const dotsButtons = screen.getAllByTestId(FEE_ACTIONS_BUTTON_TEST_ID)

        expect(actionCells.length).toBe(dotsButtons.length)
        expect(actionCells.length).toBeGreaterThan(0)
      })
    })
  })
})
