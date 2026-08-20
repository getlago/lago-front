import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { GetCreditNotesListDocument, GetCreditNotesListQueryVariables } from '~/generated/graphql'
import { render } from '~/test-utils'
import { getOperationVariableTypeName } from '~/test-utils/graphqlDocument'

import CreditNotesPage from '../CreditNotesPage'

// Largest value the operation accepted while `$amountFrom` / `$amountTo` were
// declared as `Int`; anything above it needs `BigInt`.
const MAX_32_BIT_SIGNED_INT = 2_147_483_647

// 50,000,000 USD serializes to 5,000,000,000 cents, well past that limit.
const AMOUNT_FILTER_ABOVE_32_BIT = 'isBetween,50000000,60000000'
const EXPECTED_AMOUNT_FROM = 5_000_000_000
const EXPECTED_AMOUNT_TO = 6_000_000_000

let capturedConfig: MainHeaderConfig | null = null
let capturedListVariables: GetCreditNotesListQueryVariables | null = null

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

const mockCreateExport = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetCreditNotesListLazyQuery: (options?: { variables?: GetCreditNotesListQueryVariables }) => {
    capturedListVariables = options?.variables ?? null

    return [
      jest.fn(),
      {
        data: {
          creditNotes: {
            metadata: { currentPage: 1, totalPages: 1, totalCount: 3 },
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
  useCreateCreditNotesDataExportMutation: () => [mockCreateExport],
}))

jest.mock('~/components/creditNote/CreditNotesTable', () => ({
  __esModule: true,
  default: () => <div data-test="credit-notes-table-mock">CreditNotesTable</div>,
}))

jest.mock('~/components/exports/ExportDialog', () => ({
  useExportDialog: () => ({ openExportDialog: jest.fn() }),
}))

describe('CreditNotesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    capturedListVariables = null
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the CreditNotesTable component', () => {
        render(<CreditNotesPage />)

        expect(screen.getByTestId('credit-notes-table-mock')).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<CreditNotesPage />)

        expect(capturedConfig?.entity?.viewName).toBe('text_66461ada56a84401188e8c63')
      })

      it('THEN should configure MainHeader with one export action', () => {
        render(<CreditNotesPage />)

        expect(capturedConfig?.actions?.items).toHaveLength(1)
        expect(capturedConfig?.actions?.items[0].type).toBe('action')
      })

      it('THEN should configure MainHeader with a filtersSection', () => {
        render(<CreditNotesPage />)

        expect(capturedConfig?.filtersSection).toBeDefined()
      })
    })
  })

  describe('GIVEN there are credit notes', () => {
    describe('WHEN the export action is configured', () => {
      it('THEN the export action should not be disabled', () => {
        render(<CreditNotesPage />)

        const action = capturedConfig?.actions?.items[0]

        expect(action?.type === 'action' && action.disabled).toBeFalsy()
      })
    })
  })

  describe('GIVEN an amount filter above the 32-bit limit', () => {
    describe('WHEN the page reads it from the URL', () => {
      it('THEN should send the serialized amounts to the list query untruncated', () => {
        window.history.pushState({}, '', `/credit-notes?cn_amount=${AMOUNT_FILTER_ABOVE_32_BIT}`)

        try {
          render(<CreditNotesPage />)

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
        expect(getOperationVariableTypeName(GetCreditNotesListDocument, 'amountFrom')).toBe(
          'BigInt',
        )
        expect(getOperationVariableTypeName(GetCreditNotesListDocument, 'amountTo')).toBe('BigInt')
      })
    })
  })
})
