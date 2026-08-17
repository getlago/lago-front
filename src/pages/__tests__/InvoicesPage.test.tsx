import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { TranslateFunc } from '~/hooks/core/useInternationalization'
import { render } from '~/test-utils'

import InvoicesPage from '../InvoicesPage'

let capturedConfig: MainHeaderConfig | null = null

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
    // Interpolated values are appended so tests can assert on them without matching keys
    translate: (key: string, args?: Record<string, unknown>) =>
      args ? [key, ...Object.values(args)].join(' ') : key,
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

const UNCAPPED_METADATA = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 5,
  totalCountCapped: false,
  hasNextPage: false,
}

let mockInvoicesMetadata: typeof UNCAPPED_METADATA = UNCAPPED_METADATA

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetInvoicesListLazyQuery: () => [
    jest.fn(),
    {
      data: {
        invoices: {
          metadata: mockInvoicesMetadata,
          collection: [],
        },
      },
      loading: false,
      error: null,
      fetchMore: jest.fn(),
      variables: {},
    },
  ],
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

const mockOpenExportDialog = jest.fn()

jest.mock('~/components/exports/ExportDialog', () => ({
  useExportDialog: () => ({ openExportDialog: mockOpenExportDialog }),
}))

const mockFormatCountToMetadata = jest.fn()

jest.mock('~/components/MainHeader/formatCountToMetadata', () => ({
  formatCountToMetadata: (
    count: number | undefined | null,
    translate: TranslateFunc,
    capped?: boolean,
  ) => mockFormatCountToMetadata(count, translate, capped),
}))

const openExportDialogFromHeader = (): void => {
  const exportAction = capturedConfig?.actions?.items[0]

  if (exportAction?.type === 'action') {
    exportAction.onClick?.()
  }
}

describe('InvoicesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
    mockInvoicesMetadata = UNCAPPED_METADATA
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

  describe('GIVEN the total is exact', () => {
    describe('WHEN the header count is built', () => {
      it('THEN should format it as an exact total', () => {
        render(<InvoicesPage />)

        expect(mockFormatCountToMetadata).toHaveBeenCalledWith(5, expect.any(Function), false)
      })
    })

    describe('WHEN the export dialog is opened', () => {
      it('THEN should label it with the raw count', () => {
        render(<InvoicesPage />)

        openExportDialogFromHeader()

        expect(mockOpenExportDialog).toHaveBeenCalledWith(
          expect.objectContaining({ totalCountLabel: expect.stringContaining('5') }),
        )
      })
    })
  })

  describe('GIVEN the total is capped', () => {
    const CAPPED_METADATA = {
      currentPage: 1,
      totalPages: 500,
      totalCount: 10000,
      totalCountCapped: true,
      hasNextPage: true,
    }

    beforeEach(() => {
      mockInvoicesMetadata = CAPPED_METADATA
    })

    describe('WHEN the header count is built', () => {
      it('THEN should flag it as capped', () => {
        render(<InvoicesPage />)

        expect(mockFormatCountToMetadata).toHaveBeenCalledWith(10000, expect.any(Function), true)
      })
    })

    describe('WHEN the export dialog is opened', () => {
      it('THEN should label it with the formatted floor', () => {
        render(<InvoicesPage />)

        openExportDialogFromHeader()

        expect(mockOpenExportDialog).toHaveBeenCalledWith(
          expect.objectContaining({ totalCountLabel: expect.stringContaining('10,000') }),
        )
      })
    })

    describe('WHEN the export action is configured', () => {
      it('THEN should stay enabled (a capped total is a real count)', () => {
        render(<InvoicesPage />)

        const exportAction = capturedConfig?.actions?.items[0]

        expect(exportAction?.type === 'action' && exportAction.disabled).toBeFalsy()
      })
    })
  })
})
