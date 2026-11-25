import { act, renderHook, screen } from '@testing-library/react'
import { ReactElement } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import {
  MoveToLiveBlockingReasonEnum,
  MoveToLiveItemFragment,
  MoveToLiveItemTypeEnum,
  MoveToLiveMovableItemTypeEnum,
  MoveToLivePreviewQuery,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  MOVE_TO_LIVE_COPIED_ITEMS_TEST_ID,
  MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID,
  useMoveToLive,
} from '../useMoveToLive'

const mockDialogOpen = jest.fn()
const mockGetPreview = jest.fn()
const mockMoveToLiveMode = jest.fn()
const mockUseSandbox = jest.fn()
const mockHasPermissions = jest.fn()
const mockRefetchQueries = jest.fn()

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ refetchQueries: mockRefetchQueries }),
}))

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/useSandbox', () => ({
  useSandbox: () => mockUseSandbox(),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, string>) =>
      data ? `${key}|${Object.values(data).join('|')}` : key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useMoveToLivePreviewLazyQuery: () => [mockGetPreview],
  useMoveToLiveModeMutation: () => [mockMoveToLiveMode],
}))

const ALREADY_EXISTS_KEY = 'text_1795431906433xcd1rme3cdx'
const CODE_CONFLICT_KEY = 'text_17955393256589pupqccgr1x'
const NOT_FOUND_KEY = 'text_1795539325659cdyvy8085m1'
const PARENT_MISSING_KEY = 'text_1795431906433wbhymkx79qb'
const ADMIN_ONLY_KEY = 'text_1795431906433pfg3dttjin2'
const ORGANIZATION_INACTIVE_KEY = 'text_1795431906433mautyr4e7ta'
const UNSUPPORTED_KEY = 'text_1795431906433m4kipo8c27k'
const METRIC_MISMATCH_KEY = 'text_1795519357323iuwdw2rfp07'
const RATE_MISMATCH_KEY = 'text_1795597376102tkbcu8a4f52'
const CURRENCY_MISMATCH_KEY = 'text_17955199987175qsul4nkfxe'
const FEATURE_UNAVAILABLE_KEY = 'text_1795619366911o3vnwd5udy6'
const FILTER_NOT_FOUND_KEY = 'text_1795619366911a8sk62vg94f'
const FILTER_VALUE_MISSING_KEY = 'text_1795630961583o318oscsu8g'
const CUSTOM_AGGREGATION_KEY = 'text_1795632118353nbberbjhk7i'
const UNKNOWN_ITEM_TYPE_KEY = 'text_17954414475352pip2ykpd9z'
const UNKNOWN_BLOCKING_REASON_KEY = 'text_1795441447536k9lkdhz1ect'
const SUCCESS_KEY = 'text_1795431906433hn8hins2pus'
const ERROR_KEY = 'text_17954319064335ads00pkxh8'
const BILLABLE_METRIC_LABEL_KEY = 'text_1795431906433n4atjiccd3h'
const PRODUCT_LABEL_KEY = 'text_1795431906434ld1peo7t04a'
const PRODUCT_CATEGORY_LABEL_KEY = 'text_1795431906434cs56t3kl5lh'
const PRICING_UNIT_LABEL_KEY = 'text_1795431906433676fmxuhwig'
const RATE_CARD_LABEL_KEY = 'text_17954319064341xdvy2c5ckl'

const TARGET = { itemType: MoveToLiveMovableItemTypeEnum.Product, id: 'product-1' }

const buildItem = (overrides: Partial<MoveToLiveItemFragment> = {}): MoveToLiveItemFragment => ({
  __typename: 'MoveToLiveItem',
  id: 'product-1',
  itemType: MoveToLiveItemTypeEnum.Product,
  code: 'storage',
  name: 'Storage',
  ...overrides,
})

const PRODUCT = buildItem()
const METRIC = buildItem({
  id: 'metric-1',
  itemType: MoveToLiveItemTypeEnum.BillableMetric,
  code: 'gb',
  name: 'Gigabytes',
})
const RATE_CARD = buildItem({
  id: 'rate-card-1',
  itemType: MoveToLiveItemTypeEnum.RateCard,
  code: 'storage_rate',
  name: null,
})
const PRICING_UNIT = buildItem({
  id: 'pricing-unit-1',
  itemType: MoveToLiveItemTypeEnum.PricingUnit,
  code: 'credits',
  name: 'Credits',
})
const CATEGORY = buildItem({
  id: 'category-1',
  itemType: MoveToLiveItemTypeEnum.ProductCategory,
  code: 'cloud',
  name: 'Cloud',
})

const buildPreview = (
  overrides: Partial<MoveToLivePreviewQuery['moveToLivePreview']> = {},
): { data: MoveToLivePreviewQuery } => ({
  data: {
    moveToLivePreview: {
      __typename: 'MoveToLivePreview',
      blockingReason: null,
      copiedItems: [PRODUCT],
      reusedItems: [],
      missingParent: null,
      refusedItem: null,
      ...overrides,
    },
  },
})

const renderUseMoveToLive = () => renderHook(() => useMoveToLive()).result

const moveToLive = async (): Promise<void> => {
  const result = renderUseMoveToLive()

  await act(() => result.current.moveToLive(TARGET))
}

const openedDialog = (): CentralizedDialogProps => mockDialogOpen.mock.calls[0][0]

describe('useMoveToLive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: null })
    mockHasPermissions.mockReturnValue(true)
  })

  describe('canMoveToLive', () => {
    it('GIVEN a sandbox and the move permission THEN it is true', () => {
      expect(renderUseMoveToLive().current.canMoveToLive).toBe(true)
      expect(mockHasPermissions).toHaveBeenCalledWith(['moveToLiveCreate'])
    })

    it('GIVEN a production organization THEN it is false', () => {
      mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })

      expect(renderUseMoveToLive().current.canMoveToLive).toBe(false)
    })

    it('GIVEN a sandbox member without the move permission THEN it is false', () => {
      mockHasPermissions.mockReturnValue(false)

      expect(renderUseMoveToLive().current.canMoveToLive).toBe(false)
    })
  })

  describe('moveToLive', () => {
    describe('GIVEN the preview has no blocking reason', () => {
      it('THEN it previews the target and opens the confirmation dialog', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())

        await moveToLive()

        expect(mockGetPreview).toHaveBeenCalledWith({ variables: TARGET })
        expect(addToast).not.toHaveBeenCalled()
        expect(openedDialog()).toEqual(
          expect.objectContaining({
            description: 'text_1795431906433hmboas9jg4e',
            actionText: 'text_1795431906432py065218gdv',
            colorVariant: 'danger',
            cancelOrCloseText: 'cancel',
            closeOnError: false,
            headerContent: undefined,
          }),
        )

        render(openedDialog().title as ReactElement)

        expect(screen.getByText('text_1795431906433rcppnbh5k88|storage')).toBeInTheDocument()
      })

      it('THEN the dialog lists the items copied along and the reused items, without the moved item', async () => {
        mockGetPreview.mockResolvedValue(
          buildPreview({ copiedItems: [PRODUCT, RATE_CARD], reusedItems: [METRIC] }),
        )

        await moveToLive()

        render(openedDialog().headerContent as ReactElement)

        const copied = screen.getByTestId(MOVE_TO_LIVE_COPIED_ITEMS_TEST_ID)
        const reused = screen.getByTestId(MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID)

        expect(copied).toHaveTextContent(`storage_rate${RATE_CARD_LABEL_KEY} · storage_rate`)
        expect(copied).not.toHaveTextContent('Storage')
        expect(reused).toHaveTextContent(`Gigabytes${BILLABLE_METRIC_LABEL_KEY} · gb`)
      })

      it('THEN a section without items is not rendered', async () => {
        mockGetPreview.mockResolvedValue(buildPreview({ reusedItems: [METRIC] }))

        await moveToLive()

        render(openedDialog().headerContent as ReactElement)

        expect(screen.queryByTestId(MOVE_TO_LIVE_COPIED_ITEMS_TEST_ID)).not.toBeInTheDocument()
        expect(screen.getByTestId(MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('GIVEN the preview has a blocking reason', () => {
      it.each([
        [
          'the code is already live',
          { blockingReason: MoveToLiveBlockingReasonEnum.ValueAlreadyExist },
          `${ALREADY_EXISTS_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'the parent is not live',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveParentMissing,
            missingParent: CATEGORY,
          },
          `${PARENT_MISSING_KEY}|${PRODUCT_CATEGORY_LABEL_KEY}|cloud`,
        ],
        [
          'an item copied along takes a live code',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: METRIC,
            refusalCode: 'value_already_exist',
            refusalField: 'code',
          },
          `${CODE_CONFLICT_KEY}|${BILLABLE_METRIC_LABEL_KEY}|gb`,
        ],
        [
          'a prorated rate card would bill a live metric that cannot prorate',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'requires_recurring_metric',
            refusalField: 'proration',
          },
          `${METRIC_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a prorated rate card would bill a live metric whose aggregation cannot prorate',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_allowed_for_aggregation_type',
            refusalField: 'proration',
          },
          `${METRIC_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a rate would land on a live product or metric that cannot price it',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_allowed_for_aggregation_type',
            refusalField: 'rateModel',
          },
          `${RATE_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a rate of a list would land on a live product or metric that cannot price it',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_allowed_for_aggregation_type',
            refusalField: 'rates[0].rateModel',
          },
          `${RATE_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a reused live metric lacks a filter value of the product',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: PRODUCT,
            refusalCode: 'value_is_invalid',
            refusalField: 'values[0].value',
          },
          `${FILTER_VALUE_MISSING_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'production refuses a field of a list without a message of its own',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_allowed_for_billing_timing',
            refusalField: 'rates[0].minAmountCents',
          },
          `${UNSUPPORTED_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a rate of a prorated card uses a model that cannot prorate',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_allowed_with_proration',
            refusalField: 'ratePhases[0].rateOverride.rateModel',
          },
          `${RATE_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'a metric with a custom aggregation production cannot run',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: METRIC,
            refusalCode: 'feature_unavailable',
          },
          `${CUSTOM_AGGREGATION_KEY}|${BILLABLE_METRIC_LABEL_KEY}|gb`,
        ],
        [
          'a metric with a custom aggregation that the copy cannot carry',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: METRIC,
            refusalCode: 'value_is_mandatory',
            refusalField: 'customAggregator',
          },
          `${CUSTOM_AGGREGATION_KEY}|${BILLABLE_METRIC_LABEL_KEY}|gb`,
        ],
        [
          'an item copied along needs a premium license',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: PRICING_UNIT,
            refusalCode: 'feature_unavailable',
          },
          `${FEATURE_UNAVAILABLE_KEY}|${PRICING_UNIT_LABEL_KEY}|credits`,
        ],
        [
          'a live product lacks the filter of a rate card',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'not_found',
            refusalField: 'productFilter',
          },
          `${FILTER_NOT_FOUND_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'the rate card currency differs from the plan',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'currency_does_not_match',
            refusalField: 'currency',
          },
          `${CURRENCY_MISMATCH_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'production refuses a field without a message of its own',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: RATE_CARD,
            refusalCode: 'value_is_invalid',
            refusalField: 'appliedPricingUnitCode',
          },
          `${UNSUPPORTED_KEY}|${RATE_CARD_LABEL_KEY}|${RATE_CARD.code}`,
        ],
        [
          'production refuses an item without a field',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveItemRefused,
            refusedItem: METRIC,
            refusalCode: 'some_future_code',
          },
          `${UNSUPPORTED_KEY}|${BILLABLE_METRIC_LABEL_KEY}|gb`,
        ],
        [
          'the item applies to items that cannot be moved',
          { blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveUnsupportedTarget },
          `${UNSUPPORTED_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'the moved item is already live',
          { blockingReason: MoveToLiveBlockingReasonEnum.ValueAlreadyExist, copiedItems: [] },
          `${ALREADY_EXISTS_KEY}|${PRODUCT_LABEL_KEY}|`,
        ],
        [
          'the user is not a production admin',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveAdminOnly,
            copiedItems: [],
          },
          `${ADMIN_ONLY_KEY}|${PRODUCT_LABEL_KEY}|`,
        ],
        [
          'production waits for a card',
          {
            blockingReason: MoveToLiveBlockingReasonEnum.OrganizationInactive,
            copiedItems: [],
          },
          `${ORGANIZATION_INACTIVE_KEY}|${PRODUCT_LABEL_KEY}|`,
        ],
      ])(
        'WHEN %s THEN it shows the info toast and opens no dialog',
        async (_, preview, message) => {
          mockGetPreview.mockResolvedValue(buildPreview(preview))

          await moveToLive()

          expect(addToast).toHaveBeenCalledWith({ severity: 'info', message })
          expect(mockDialogOpen).not.toHaveBeenCalled()
        },
      )
    })

    describe('GIVEN the API answers values this build does not know', () => {
      const CATALOG_PLAN = buildItem({
        id: 'plan-1',
        itemType: 'catalog_plan' as MoveToLiveItemTypeEnum,
        code: 'starter',
        name: 'Starter',
      })

      it('WHEN the blocking reason is unknown THEN the toast uses the generic message', async () => {
        mockGetPreview.mockResolvedValue(
          buildPreview({ blockingReason: 'plan_locked' as MoveToLiveBlockingReasonEnum }),
        )

        await moveToLive()

        expect(addToast).toHaveBeenCalledWith({
          severity: 'info',
          message: `${UNKNOWN_BLOCKING_REASON_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        })
      })

      it('WHEN the blocking item type is unknown THEN the toast uses the generic item label', async () => {
        mockGetPreview.mockResolvedValue(
          buildPreview({
            blockingReason: MoveToLiveBlockingReasonEnum.MoveToLiveParentMissing,
            missingParent: CATALOG_PLAN,
          }),
        )

        await moveToLive()

        expect(addToast).toHaveBeenCalledWith({
          severity: 'info',
          message: `${PARENT_MISSING_KEY}|${UNKNOWN_ITEM_TYPE_KEY}|starter`,
        })
      })

      it('WHEN a listed item type is unknown THEN the dialog uses the generic item label', async () => {
        mockGetPreview.mockResolvedValue(buildPreview({ reusedItems: [CATALOG_PLAN] }))

        await moveToLive()

        render(openedDialog().headerContent as ReactElement)

        expect(screen.getByTestId(MOVE_TO_LIVE_REUSED_ITEMS_TEST_ID)).toHaveTextContent(
          `Starter${UNKNOWN_ITEM_TYPE_KEY} · starter`,
        )
      })
    })

    describe('GIVEN a double click on the action', () => {
      it('THEN it previews once until the first preview answers', async () => {
        let resolvePreview: (value: ReturnType<typeof buildPreview>) => void = () => undefined

        mockGetPreview.mockReturnValueOnce(
          new Promise((resolve) => {
            resolvePreview = resolve
          }),
        )
        mockGetPreview.mockResolvedValue(buildPreview())

        const result = renderUseMoveToLive()

        await act(async () => {
          const first = result.current.moveToLive(TARGET)
          const second = result.current.moveToLive(TARGET)

          resolvePreview(buildPreview())
          await Promise.all([first, second])
        })

        expect(mockGetPreview).toHaveBeenCalledTimes(1)
        expect(mockDialogOpen).toHaveBeenCalledTimes(1)

        await act(() => result.current.moveToLive(TARGET))

        expect(mockGetPreview).toHaveBeenCalledTimes(2)
      })
    })

    describe('GIVEN the item was deleted from the sandbox', () => {
      const NOT_FOUND_ERRORS = [
        { message: 'Resource not found', extensions: { code: 'not_found' } },
      ]

      it('WHEN the preview answers not found THEN it says so and refetches the lists', async () => {
        mockGetPreview.mockResolvedValue({ error: { graphQLErrors: NOT_FOUND_ERRORS } })

        await moveToLive()

        expect(addToast).toHaveBeenCalledWith({ severity: 'info', translateKey: NOT_FOUND_KEY })
        expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' })
        expect(mockDialogOpen).not.toHaveBeenCalled()
      })

      it('WHEN the move answers not found THEN it says so without a second preview', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: null },
          errors: NOT_FOUND_ERRORS,
        })

        await moveToLive()
        await act(async () => {
          await openedDialog().onAction()
        })

        expect(mockGetPreview).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({ severity: 'info', translateKey: NOT_FOUND_KEY })
        expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' })
      })
    })

    describe('GIVEN the preview fails', () => {
      it.each([
        ['with a GraphQL error', () => mockGetPreview.mockResolvedValue({ error: new Error('x') })],
        ['without data', () => mockGetPreview.mockResolvedValue({ data: undefined })],
        ['with a network error', () => mockGetPreview.mockRejectedValue(new Error('offline'))],
      ])('WHEN it resolves %s THEN it shows the error toast', async (_, setup) => {
        setup()

        await moveToLive()

        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', translateKey: ERROR_KEY })
        expect(mockDialogOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the user confirms', () => {
      const confirm = async (): Promise<void> => {
        await moveToLive()
        await act(async () => {
          await openedDialog().onAction()
        })
      }

      it('THEN it moves the target and shows the success toast with the live item', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: buildItem({ id: 'live-product-1' }) },
        })

        await confirm()

        expect(mockMoveToLiveMode).toHaveBeenCalledWith({ variables: { input: TARGET } })
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: `${SUCCESS_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        })
      })

      it('GIVEN the move fails and the preview now blocks THEN it shows the blocking reason', async () => {
        mockGetPreview
          .mockResolvedValueOnce(buildPreview())
          .mockResolvedValueOnce(
            buildPreview({ blockingReason: MoveToLiveBlockingReasonEnum.ValueAlreadyExist }),
          )
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: null },
          errors: [{ message: 'Unprocessable Entity' }],
        })

        await confirm()

        expect(mockGetPreview).toHaveBeenCalledTimes(2)
        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({
          severity: 'info',
          message: `${ALREADY_EXISTS_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        })
      })

      it('GIVEN the move fails because the item went live meanwhile THEN the toast keeps its code', async () => {
        mockGetPreview.mockResolvedValueOnce(buildPreview()).mockResolvedValueOnce(
          buildPreview({
            blockingReason: MoveToLiveBlockingReasonEnum.ValueAlreadyExist,
            copiedItems: [],
          }),
        )
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: null },
          errors: [{ message: 'Unprocessable Entity' }],
        })

        await confirm()

        expect(addToast).toHaveBeenCalledWith({
          severity: 'info',
          message: `${ALREADY_EXISTS_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        })
      })

      it('GIVEN the move fails and the preview does not block THEN it shows the error toast', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: null },
          errors: [{ message: 'Internal Error' }],
        })

        await confirm()

        expect(addToast).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', translateKey: ERROR_KEY })
      })

      it.each([
        [
          'a validation',
          {
            code: 'unprocessable_entity',
            details: { proration: ['requires_recurring_metric'] },
          },
          `${METRIC_MISMATCH_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'a nested validation without a message of its own',
          {
            code: 'unprocessable_entity',
            details: { appliesTo: { include: ['value_is_invalid'] } },
          },
          `${UNSUPPORTED_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'a production resource not found',
          { code: 'not_found', details: { productFilter: ['not_found'] } },
          `${FILTER_NOT_FOUND_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'a forbidden code',
          { code: 'feature_unavailable' },
          `${FEATURE_UNAVAILABLE_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
        [
          'a move refusal',
          { code: 'organization_inactive' },
          `${ORGANIZATION_INACTIVE_KEY}|${PRODUCT_LABEL_KEY}|storage`,
        ],
      ])(
        'GIVEN the move answers %s and the preview does not block THEN it shows that refusal',
        async (_, extensions, message) => {
          mockGetPreview.mockResolvedValue(buildPreview())
          mockMoveToLiveMode.mockResolvedValue({
            data: { moveToLiveMode: null },
            errors: [{ message: 'Refused', extensions }],
          })

          await confirm()

          expect(addToast).toHaveBeenCalledTimes(1)
          expect(addToast).toHaveBeenCalledWith({ severity: 'info', message })
          expect(mockRefetchQueries).not.toHaveBeenCalled()
        },
      )

      it('GIVEN the move answers the moved item not found THEN it says so and refetches the lists', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockResolvedValue({
          data: { moveToLiveMode: null },
          errors: [
            {
              message: 'Not found',
              extensions: { code: 'not_found', details: { product: ['not_found'] } },
            },
          ],
        })

        await confirm()

        expect(addToast).toHaveBeenCalledWith({ severity: 'info', translateKey: NOT_FOUND_KEY })
        expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' })
      })

      it('GIVEN a double click on confirm THEN it moves once', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockResolvedValue({ data: { moveToLiveMode: buildItem() } })

        await moveToLive()

        await act(async () => {
          await Promise.all([openedDialog().onAction(), openedDialog().onAction()])
        })

        expect(mockMoveToLiveMode).toHaveBeenCalledTimes(1)
      })

      it('GIVEN a network failure THEN the dialog error handler shows the error toast', async () => {
        mockGetPreview.mockResolvedValue(buildPreview())
        mockMoveToLiveMode.mockRejectedValue(new Error('offline'))

        await moveToLive()

        await expect(openedDialog().onAction()).rejects.toThrow('offline')

        openedDialog().onError?.(new Error('offline'))

        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', translateKey: ERROR_KEY })

        mockMoveToLiveMode.mockResolvedValue({ data: { moveToLiveMode: buildItem() } })

        await act(async () => {
          await openedDialog().onAction()
        })

        expect(mockMoveToLiveMode).toHaveBeenCalledTimes(2)
      })
    })
  })
})
