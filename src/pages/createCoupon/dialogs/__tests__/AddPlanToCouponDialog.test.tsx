import { renderHook } from '@testing-library/react'

import { PlansForCouponsFragment } from '~/generated/graphql'

import { useAddPlanToCouponDialog } from '../AddPlanToCouponDialog'

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
  useGetPlansForCouponsLazyQuery: jest
    .fn()
    .mockReturnValue([jest.fn(), { loading: false, data: undefined }]),
}))

const mockPlan: PlansForCouponsFragment = {
  id: 'plan-1',
  name: 'Premium Plan',
  code: 'premium_plan',
}

describe('useAddPlanToCouponDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN openAddPlanToCouponDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open with correct form config', () => {
        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({
          onSubmit: jest.fn(),
          attachedPlansIds: ['plan-existing'],
        })

        expect(mockFormDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            closeOnError: false,
            form: expect.objectContaining({
              id: 'add-plan-to-coupon-form',
              submit: expect.any(Function),
            }),
          }),
        )
      })
    })

    describe('WHEN form submit is called without selecting a plan', () => {
      it('THEN should throw an error', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { form } = mockFormDialogOpen.mock.calls[0][0]

        expect(() => form.submit()).toThrow('No plan selected')
        expect(onSubmit).not.toHaveBeenCalled()
      })
    })

    describe('WHEN form submit is called after selecting a plan', () => {
      it('THEN should call onSubmit with the selected plan', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        children.props.onSelect(mockPlan)
        form.submit()

        expect(onSubmit).toHaveBeenCalledWith(mockPlan)
      })
    })

    describe('WHEN the dialog is opened again after a previous selection', () => {
      it('THEN should reset the selected plan ref', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        // First open + select
        result.current.openAddPlanToCouponDialog({ onSubmit })
        mockFormDialogOpen.mock.calls[0][0].children.props.onSelect(mockPlan)

        // Second open (should reset)
        result.current.openAddPlanToCouponDialog({ onSubmit })

        expect(() => mockFormDialogOpen.mock.calls[1][0].form.submit()).toThrow('No plan selected')
      })
    })

    describe('WHEN onSelect is called with undefined after a selection', () => {
      it('THEN should clear the selected plan', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        children.props.onSelect(mockPlan)
        children.props.onSelect(undefined)

        expect(() => form.submit()).toThrow('No plan selected')
      })
    })
  })
})
