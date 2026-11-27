import { act, renderHook, screen } from '@testing-library/react'
import { GraphQLFormattedError } from 'graphql'
import { ReactElement } from 'react'

import { CentralizedDialogProps } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { CopyToProductionCopyableItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useCopyToProduction } from '../useCopyToProduction'

const mockDialogOpen = jest.fn()
const mockCopyToProduction = jest.fn()
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
  useCopyToProductionMutation: () => [mockCopyToProduction],
}))

const TITLE_KEY = 'text_1795431906433rcppnbh5k88'
const DESCRIPTION_KEY = 'text_1795431906433hmboas9jg4e'
const ACTION_KEY = 'text_17957683665190k45li34638'
const SUCCESS_KEY = 'text_1795431906433hn8hins2pus'
const SUCCESS_WITH_LINK_KEY = 'text_1795768366519ycewco9f1qj'
const ERROR_KEY = 'text_17954319064335ads00pkxh8'
const NOT_FOUND_KEY = 'text_1795539325659cdyvy8085m1'
const ALREADY_EXISTS_KEY = 'text_1795431906433xcd1rme3cdx'
const PARENT_MISSING_KEY = 'text_1795431906433wbhymkx79qb'
const ADMIN_ONLY_KEY = 'text_1795431906433pfg3dttjin2'
const UNSUPPORTED_KEY = 'text_1795431906433m4kipo8c27k'
const RATE_MISMATCH_KEY = 'text_1795597376102tkbcu8a4f52'
const FILTER_VALUE_MISSING_KEY = 'text_1795630961583o318oscsu8g'
const CUSTOM_AGGREGATION_KEY = 'text_1795632118353nbberbjhk7i'
const UNKNOWN_ITEM_TYPE_KEY = 'text_17954414475352pip2ykpd9z'
const PRODUCT_LABEL_KEY = 'text_1795431906434ld1peo7t04a'
const PRODUCT_CATEGORY_LABEL_KEY = 'text_1795431906434cs56t3kl5lh'
const BILLABLE_METRIC_LABEL_KEY = 'text_1795431906433n4atjiccd3h'

const TARGET = {
  itemType: CopyToProductionCopyableItemTypeEnum.Product,
  id: 'product-1',
  code: 'storage',
}

const failWith = (...errors: GraphQLFormattedError[]) =>
  mockCopyToProduction.mockResolvedValue({ data: null, errors })

const openDialog = (target = TARGET): CentralizedDialogProps => {
  const { result } = renderHook(() => useCopyToProduction())

  result.current.copyToProduction(target)

  return mockDialogOpen.mock.calls[0][0]
}

const confirm = async (target = TARGET): Promise<void> => {
  const dialog = openDialog(target)

  await act(() => dialog.onAction())
}

const toastMessage = (): string | undefined => jest.mocked(addToast).mock.calls[0]?.[0].message

describe('useCopyToProduction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: null })
    mockHasPermissions.mockReturnValue(true)
    mockCopyToProduction.mockResolvedValue({
      data: { copyToProduction: { id: 'live-product-1', code: 'storage' } },
    })
  })

  describe('canCopyToProduction', () => {
    it('GIVEN a sandbox and the copy permission THEN it is true', () => {
      const { result } = renderHook(() => useCopyToProduction())

      expect(result.current.canCopyToProduction).toBe(true)
      expect(mockHasPermissions).toHaveBeenCalledWith(['copyToProductionCreate'])
    })

    it('GIVEN a production organization THEN it is false', () => {
      mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })

      const { result } = renderHook(() => useCopyToProduction())

      expect(result.current.canCopyToProduction).toBe(false)
    })

    it('GIVEN a sandbox member without the copy permission THEN it is false', () => {
      mockHasPermissions.mockReturnValue(false)

      const { result } = renderHook(() => useCopyToProduction())

      expect(result.current.canCopyToProduction).toBe(false)
    })
  })

  describe('copyToProduction', () => {
    it('THEN it opens the confirmation dialog without calling the API', () => {
      const dialog = openDialog()

      expect(mockCopyToProduction).not.toHaveBeenCalled()
      expect(dialog).toEqual(
        expect.objectContaining({
          description: DESCRIPTION_KEY,
          actionText: ACTION_KEY,
          cancelOrCloseText: 'cancel',
          closeOnError: false,
        }),
      )

      render(dialog.title as ReactElement)

      expect(screen.getByText(`${TITLE_KEY}|storage`)).toBeInTheDocument()
    })

    describe('WHEN the user confirms', () => {
      it('THEN it copies the item and confirms it', async () => {
        await confirm()

        expect(mockCopyToProduction).toHaveBeenCalledWith({ variables: { input: TARGET } })
        expect(addToast).toHaveBeenCalledWith({
          severity: 'success',
          message: `${SUCCESS_KEY}|storage`,
        })
      })

      it('GIVEN the user can open production THEN the confirmation links to it', async () => {
        mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: '/acme/products' })

        await confirm()

        expect(toastMessage()).toBe(`${SUCCESS_WITH_LINK_KEY}|storage|/acme/products`)
      })

      it('GIVEN a second confirmation while the first runs THEN it copies once', async () => {
        const dialog = openDialog()

        await act(() => Promise.all([dialog.onAction(), dialog.onAction()]))

        expect(mockCopyToProduction).toHaveBeenCalledTimes(1)
      })

      it('GIVEN the item is live THEN it says it already exists', async () => {
        failWith({
          message: 'Unprocessable Entity',
          extensions: { code: 'unprocessable_entity', details: { code: ['value_already_exist'] } },
        })

        await confirm()

        expect(toastMessage()).toBe(`${ALREADY_EXISTS_KEY}|${PRODUCT_LABEL_KEY}|storage`)
      })

      it('GIVEN its parent is not live THEN it names the parent', async () => {
        failWith({
          message: 'forbidden',
          extensions: {
            code: 'copy_to_production_parent_missing',
            details: { itemType: 'product_category', code: 'cloud' },
          },
        })

        await confirm()

        expect(toastMessage()).toBe(`${PARENT_MISSING_KEY}|${PRODUCT_CATEGORY_LABEL_KEY}|cloud`)
      })

      it('GIVEN the user is not an admin of production THEN it says so', async () => {
        failWith({ message: 'forbidden', extensions: { code: 'copy_to_production_admin_only' } })

        await confirm()

        expect(toastMessage()).toBe(`${ADMIN_ONLY_KEY}|${PRODUCT_LABEL_KEY}|storage`)
      })

      it('GIVEN a create service refuses a nested field THEN it explains it by its last key', async () => {
        failWith({
          message: 'Unprocessable Entity',
          extensions: {
            code: 'unprocessable_entity',
            details: { 'rates[0].rateModel': ['not_allowed_for_product'] },
          },
        })

        await confirm()

        expect(toastMessage()).toBe(`${RATE_MISMATCH_KEY}|${PRODUCT_LABEL_KEY}|storage`)
      })

      it('GIVEN a create service refuses a filter value THEN it explains it by its path', async () => {
        failWith({
          message: 'Unprocessable Entity',
          extensions: {
            code: 'unprocessable_entity',
            details: { 'values[2].value': ['value_is_invalid'] },
          },
        })

        await confirm()

        expect(toastMessage()).toBe(`${FILTER_VALUE_MISSING_KEY}|${PRODUCT_LABEL_KEY}|storage`)
      })

      it('GIVEN a metric with a custom aggregation THEN it explains it for that item type', async () => {
        failWith({ message: 'forbidden', extensions: { code: 'feature_unavailable' } })

        await confirm({
          itemType: CopyToProductionCopyableItemTypeEnum.BillableMetric,
          id: 'metric-1',
          code: 'gb',
        })

        expect(toastMessage()).toBe(`${CUSTOM_AGGREGATION_KEY}|${BILLABLE_METRIC_LABEL_KEY}|gb`)
      })

      it('GIVEN a code it does not know THEN it says the item cannot be copied', async () => {
        failWith({ message: 'forbidden', extensions: { code: 'something_new' } })

        await confirm()

        expect(toastMessage()).toBe(`${UNSUPPORTED_KEY}|${PRODUCT_LABEL_KEY}|storage`)
      })

      it('GIVEN a parent type it does not know THEN it names it as an item', async () => {
        failWith({
          message: 'forbidden',
          extensions: {
            code: 'copy_to_production_parent_missing',
            details: { itemType: 'something_new', code: 'x' },
          },
        })

        await confirm()

        expect(toastMessage()).toBe(`${PARENT_MISSING_KEY}|${UNKNOWN_ITEM_TYPE_KEY}|x`)
      })

      it('GIVEN the item was deleted from the sandbox THEN it says so and refreshes the lists', async () => {
        failWith({
          message: 'Resource not found',
          extensions: { code: 'not_found', details: { product: ['not_found'] } },
        })

        await confirm()

        expect(addToast).toHaveBeenCalledWith({ severity: 'info', translateKey: NOT_FOUND_KEY })
        expect(mockRefetchQueries).toHaveBeenCalledWith({ include: 'active' })
      })

      it('GIVEN an error without a code THEN it shows the generic error', async () => {
        failWith({ message: 'Internal error' })

        await confirm()

        expect(addToast).toHaveBeenCalledWith({ severity: 'danger', translateKey: ERROR_KEY })
      })
    })
  })
})
