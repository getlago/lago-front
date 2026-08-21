import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { GetInvoicesListDocument, GetInvoicesListQueryVariables } from '~/generated/graphql'
import { render } from '~/test-utils'
import { getOperationVariableTypeName } from '~/test-utils/graphqlDocument'

import InvoicesPage from '../InvoicesPage'

// Largest value the operation accepted while `$amountFrom` / `$amountTo` were
// declared as `Int`; anything above it needs `BigInt`.
const MAX_32_BIT_SIGNED_INT = 2_147_483_647

// 50,000,000 USD serializes to 5,000,000,000 cents, well past that limit.
const AMOUNT_FILTER_ABOVE_32_BIT = 'isBetween,50000000,60000000'
const EXPECTED_AMOUNT_FROM = 5_000_000_000
const EXPECTED_AMOUNT_TO = 6_000_000_000

let capturedConfig: MainHeaderConfig | null = null
let capturedListVariables: GetInvoicesListQueryVariables | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockDebouncedSearch = jest.fn()

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: mockDebouncedSearch,
    isLoading: false,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: { defaultCurrency: 'USD' },
    hasOrganizationPremiumAddon: jest.fn().mockReturnValue(false),
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: jest.fn().mockReturnValue(true),
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
  hasDefinedGQLError: jest.fn().mockReturnValue(false),
}))

const mockRetryAll = jest.fn().mockResolvedValue({ errors: undefined })
const mockCreateExport = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoicesListLazyQuery: (options?: { variables?: GetInvoicesListQueryVariables }) => {
    capturedListVariables = options?.variables ?? null

    return [
      jest.fn(),
      {
        data: {
          invoices: {
            metadata: { currentPage: 1, totalPages: 1, totalCount: 5 },
            collection: [],
          },
        },
        loading: false,
        error: null,
        fetchMore: jest.fn(),
        variables: {},
      },
    ]
  },
  useRetryAllInvoicePaymentsMutation: () => [mockRetryAll],
  useCreateInvoicesDataExportMutation: () => [mockCreateExport],
}))

jest.mock('~/components/invoices/InvoicesList', () => ({
  __esModule: true,
  default: () => <div data-test="invoices-list-mock">InvoicesList</div>,
}))

jest.mock('~/components/invoices/DeleteInvoiceDialog', () => ({
  useDeleteInvoiceDialog: () => ({ openDeleteInvoiceDialog: jest.fn() }),
}))

jest.mock('~/components/invoices/FinalizeInvoiceDialog', () => ({
  useFinalizeInvoiceDialog: () => ({ openFinalizeInvoiceDialog: jest.fn() }),
}))

jest.mock('~/components/exports/ExportDialog', () => ({
  useExportDialog: () => ({ openExportDialog: jest.fn() }),
}))

describe('InvoicesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    capturedListVariables = null
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the InvoicesList component', () => {
        render(<InvoicesPage />)

        expect(screen.getByTestId('invoices-list-mock')).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<InvoicesPage />)

        expect(capturedConfig?.entity?.viewName).toBe('text_63ac86d797f728a87b2f9f85')
      })

      it('THEN should configure MainHeader with at least one action', () => {
        render(<InvoicesPage />)

        expect(capturedConfig?.actions?.items?.length).toBeGreaterThanOrEqual(1)
      })

      it('THEN should configure MainHeader with a filtersSection', () => {
        render(<InvoicesPage />)

        expect(capturedConfig?.filtersSection).toBeDefined()
      })
    })
  })

  describe('GIVEN there are invoices', () => {
    describe('WHEN the export action is configured', () => {
      it('THEN the first action (export) should not be disabled', () => {
        render(<InvoicesPage />)

        const exportAction = capturedConfig?.actions?.items[0]

        expect(exportAction?.type === 'action' && exportAction.disabled).toBeFalsy()
      })
    })
  })

  describe('GIVEN an amount filter above the 32-bit limit', () => {
    describe('WHEN the page reads it from the URL', () => {
      it('THEN should send the serialized amounts to the list query untruncated', () => {
        window.history.pushState({}, '', `/invoices?in_amount=${AMOUNT_FILTER_ABOVE_32_BIT}`)

        try {
          render(<InvoicesPage />)

          expect(capturedListVariables?.amountFrom).toBe(EXPECTED_AMOUNT_FROM)
          expect(capturedListVariables?.amountTo).toBe(EXPECTED_AMOUNT_TO)
          expect(capturedListVariables?.amountFrom).toBeGreaterThan(MAX_32_BIT_SIGNED_INT)
        } finally {
          window.history.pushState({}, '', '/')
        }
      })
    })

    describe('WHEN the list operation is inspected', () => {
      it('THEN should declare the amount variables as BigInt', () => {
        expect(getOperationVariableTypeName(GetInvoicesListDocument, 'amountFrom')).toBe('BigInt')
        expect(getOperationVariableTypeName(GetInvoicesListDocument, 'amountTo')).toBe('BigInt')
      })
    })
  })
})
