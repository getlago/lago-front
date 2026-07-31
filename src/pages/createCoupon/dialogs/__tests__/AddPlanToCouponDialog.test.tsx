import { renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'

import {
  SelectablePlanForCouponsFragment,
  useGetPlansForCouponsLazyQuery,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import { ADD_PLAN_FORM_ID, useAddPlanToCouponDialog } from '../AddPlanToCouponDialog'

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

const mockGetPlans = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetPlansForCouponsLazyQuery: jest
    .fn()
    .mockReturnValue([jest.fn(), { loading: false, data: undefined }]),
}))

// jsdom measures a 0-height scroll element, so the real virtualizer renders no
// combobox options — render them all instead (same mock as ScopeSection.test.tsx).
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn((config) => {
    const items = Array.from({ length: config.count }, (_, i) => ({
      index: i,
      key: i,
      size: config.estimateSize(i),
      start: Array.from({ length: i }, (__, j) => config.estimateSize(j)).reduce(
        (acc, val) => acc + val,
        0,
      ),
    }))

    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((acc, item) => acc + item.size, 0),
      scrollToIndex: jest.fn(),
      measureElement: jest.fn(),
    }
  }),
}))

const mockedUseGetPlansForCouponsLazyQuery = useGetPlansForCouponsLazyQuery as jest.Mock

const mockPlan: SelectablePlanForCouponsFragment = {
  id: 'plan-1',
  name: 'Premium Plan',
  code: 'premium_plan',
}

const mockPlan2: SelectablePlanForCouponsFragment = {
  id: 'plan-2',
  name: 'Basic Plan',
  code: 'basic_plan',
}

const mockPlansData = {
  selectablePlans: {
    collection: [mockPlan, mockPlan2],
  },
}

const openDialogAndGetChildren = () => {
  const onSubmit = jest.fn()

  const { result } = renderHook(() => useAddPlanToCouponDialog())

  result.current.openAddPlanToCouponDialog({
    onSubmit,
    attachedPlansIds: ['plan-2'],
  })

  return mockFormDialogOpen.mock.calls[0][0].children as ReactElement
}

describe('useAddPlanToCouponDialog', () => {
  beforeAll(() => {
    // jsdom does not implement scrollIntoView (used when opening the combobox popup)
    Element.prototype.scrollIntoView = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is called', () => {
    describe('WHEN rendered', () => {
      it('THEN should return openAddPlanToCouponDialog function', () => {
        const { result } = renderHook(() => useAddPlanToCouponDialog())

        expect(result.current.openAddPlanToCouponDialog).toBeDefined()
        expect(typeof result.current.openAddPlanToCouponDialog).toBe('function')
      })
    })
  })

  describe('GIVEN openAddPlanToCouponDialog is called', () => {
    describe('WHEN opening the dialog', () => {
      it('THEN should call formDialog.open with correct props', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({
          onSubmit,
          attachedPlansIds: ['plan-existing'],
        })

        expect(mockFormDialogOpen).toHaveBeenCalledTimes(1)
        expect(mockFormDialogOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
            description: expect.any(String),
            closeOnError: false,
            children: expect.anything(),
            mainAction: expect.anything(),
            form: expect.objectContaining({
              id: ADD_PLAN_FORM_ID,
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

        const { children } = mockFormDialogOpen.mock.calls[0][0]

        // Simulate selection via the onSelect prop passed to AddPlanContent
        children.props.onSelect(mockPlan)

        const { form } = mockFormDialogOpen.mock.calls[0][0]

        form.submit()

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledWith(mockPlan)
      })
    })

    describe('WHEN the dialog is opened again after a previous selection', () => {
      it('THEN should reset the selected plan ref', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        // First open + select
        result.current.openAddPlanToCouponDialog({ onSubmit })
        const firstChildren = mockFormDialogOpen.mock.calls[0][0].children

        firstChildren.props.onSelect(mockPlan)

        // Second open (should reset)
        result.current.openAddPlanToCouponDialog({ onSubmit })
        const secondForm = mockFormDialogOpen.mock.calls[1][0].form

        expect(() => secondForm.submit()).toThrow('No plan selected')
      })
    })

    describe('WHEN onSelect is called with undefined', () => {
      it('THEN should clear the selected plan', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        // Select then deselect
        children.props.onSelect(mockPlan)
        children.props.onSelect(undefined)

        expect(() => form.submit()).toThrow('No plan selected')
      })
    })

    describe('WHEN attachedPlansIds are provided', () => {
      it('THEN should pass them to the children component', () => {
        const onSubmit = jest.fn()
        const attachedIds = ['plan-1', 'plan-2']

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({
          onSubmit,
          attachedPlansIds: attachedIds,
        })

        const { children } = mockFormDialogOpen.mock.calls[0][0]

        expect(children.props.attachedPlansIds).toEqual(attachedIds)
      })
    })

    describe('WHEN no attachedPlansIds are provided', () => {
      it('THEN should pass undefined to the children component', () => {
        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { children } = mockFormDialogOpen.mock.calls[0][0]

        expect(children.props.attachedPlansIds).toBeUndefined()
      })
    })
  })

  describe('GIVEN AddPlanContent is rendered', () => {
    describe('WHEN data is loading', () => {
      it('THEN should render the combobox in loading state', () => {
        mockedUseGetPlansForCouponsLazyQuery.mockReturnValue([
          mockGetPlans,
          { loading: true, data: undefined },
        ])

        const children = openDialogAndGetChildren()

        render(children)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    describe('WHEN data is loaded', () => {
      it('THEN should call getPlans on mount', () => {
        mockedUseGetPlansForCouponsLazyQuery.mockReturnValue([
          mockGetPlans,
          { loading: false, data: mockPlansData },
        ])

        const children = openDialogAndGetChildren()

        render(children)

        expect(mockGetPlans).toHaveBeenCalled()
      })
    })

    describe('WHEN no data is returned', () => {
      it('THEN should render the combobox with empty data', () => {
        mockedUseGetPlansForCouponsLazyQuery.mockReturnValue([
          mockGetPlans,
          { loading: false, data: undefined },
        ])

        const children = openDialogAndGetChildren()

        render(children)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })

    describe('WHEN opening the combobox with loaded plans', () => {
      it('THEN should render an option per plan and disable already-attached ones', async () => {
        const user = userEvent.setup()

        mockedUseGetPlansForCouponsLazyQuery.mockReturnValue([
          mockGetPlans,
          { loading: false, data: mockPlansData },
        ])

        // openDialogAndGetChildren attaches plan-2, so its option must be disabled
        const children = openDialogAndGetChildren()

        render(children)

        await user.click(screen.getByRole('combobox'))

        const options = await screen.findAllByRole('option')

        expect(options).toHaveLength(2)

        const premiumOption = options.find((option) => option.textContent?.includes('premium_plan'))
        const basicOption = options.find((option) => option.textContent?.includes('basic_plan'))

        expect(premiumOption).toHaveTextContent('Premium Plan')
        // plan-1 is not attached, plan-2 is → only the latter is disabled
        expect(premiumOption).toHaveAttribute('aria-disabled', 'false')
        expect(basicOption).toHaveAttribute('aria-disabled', 'true')
      })
    })

    describe('WHEN selecting a plan from the combobox', () => {
      it('THEN should resolve the selected plan and submit it', async () => {
        const user = userEvent.setup()

        mockedUseGetPlansForCouponsLazyQuery.mockReturnValue([
          mockGetPlans,
          { loading: false, data: mockPlansData },
        ])

        const onSubmit = jest.fn()

        const { result } = renderHook(() => useAddPlanToCouponDialog())

        result.current.openAddPlanToCouponDialog({ onSubmit })

        const { children, form } = mockFormDialogOpen.mock.calls[0][0]

        render(children)

        await user.click(screen.getByRole('combobox'))

        const options = await screen.findAllByRole('option')
        const premiumOption = options.find((option) =>
          option.textContent?.includes('premium_plan'),
        ) as HTMLElement

        await user.click(premiumOption)

        form.submit()

        expect(onSubmit).toHaveBeenCalledTimes(1)
        expect(onSubmit).toHaveBeenCalledWith(mockPlan)
      })
    })
  })
})
