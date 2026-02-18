import { renderHook } from '@testing-library/react'

import { BillableMetricsForCouponsFragment } from '~/generated/graphql'

import { useAddBillableMetricToCouponDialog } from '../AddBillableMetricToCouponDialog'

const mockFormDialogOpen = jest.fn().mockResolvedValue({ reason: 'close' })

jest.mock('~/components/dialogs/FormDialog', () => ({
  useFormDialog: () => ({
    open: mockFormDialogOpen,
    close: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillableMetricsForCouponsLazyQuery: jest
    .fn()
    .mockReturnValue([jest.fn(), { loading: false, data: undefined }]),
}))

const mockBillableMetric: BillableMetricsForCouponsFragment = {
  id: 'bm-1',
  name: 'API Calls',
  code: 'api_calls',
}

describe('useAddBillableMetricToCouponDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN openAddBillableMetricToCouponDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open with correct form config', () => {
        const { result } = renderHook(() => useAddBillableMetricToCouponDialog())

        result.current.openAddBillableMetricToCouponDialog({
          onSubmit: jest.fn(),
          attachedBillableMetricsIds: ['bm-existing'],
        })

        expect(mockFormDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            closeOnError: false,
            form: expect.objectContaining({
              id: 'add-billable-metric-to-coupon-form',
              submit: expect.any(Function),
            }),
          }),
        )
      })
    })

    describe('WHEN form submit is called without selecting a billable metric', () => {
      it('THEN should throw an error', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddBillableMetricToCouponDialog())

        result.current.openAddBillableMetricToCouponDialog({ onSubmit })

        const { form } = mockFormDialogOpen.mock.calls[0][0]

        expect(() => form.submit()).toThrow('No billable metric selected')
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN form submit is called after selecting a billable metric', () => {
      it('THEN should call onSubmit with the selected billable metric', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddBillableMetricToCouponDialog())

        result.current.openAddBillableMetricToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        children.props.onSelect(mockBillableMetric)
        form.submit()

        expect(onSubmit).toHaveBeenCalledWith(mockBillableMetric)
      })
    })

    describe('WHEN the dialog is opened again after a previous selection', () => {
      it('THEN should reset the selected billable metric ref', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddBillableMetricToCouponDialog())

        // First open + select
        result.current.openAddBillableMetricToCouponDialog({ onSubmit })
        mockFormDialogOpen.mock.calls[0][0].children.props.onSelect(mockBillableMetric)

        // Second open (should reset)
        result.current.openAddBillableMetricToCouponDialog({ onSubmit })

        expect(() => mockFormDialogOpen.mock.calls[1][0].form.submit()).toThrow(
          'No billable metric selected',
        )
      })
    })

    describe('WHEN onSelect is called with undefined after a selection', () => {
      it('THEN should clear the selected billable metric', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddBillableMetricToCouponDialog())

        result.current.openAddBillableMetricToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        children.props.onSelect(mockBillableMetric)
        children.props.onSelect(undefined)

        expect(() => form.submit()).toThrow('No billable metric selected')
      })
    })
  })
})
