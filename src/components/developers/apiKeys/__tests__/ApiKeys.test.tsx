import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import { addToast } from '~/core/apolloClient'
import { maskValue } from '~/core/formats/maskValue'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  GetApiKeysDocument,
  GetApiKeyValueDocument,
  GetOrganizationInfosForApiKeyDocument,
} from '~/generated/graphql'
import { STATE_KEY_ID_TO_REVEAL } from '~/pages/developers/ApiKeysForm'
import { AllTheProviders, TestMocksType } from '~/test-utils'

import { ApiKeys } from '../ApiKeys'
import {
  API_KEY_COPY_ACTION_TEST_ID,
  API_KEY_REVEAL_ACTION_TEST_ID,
  API_KEY_REVEAL_BUTTON_TEST_ID,
} from '../dataTestConstants'

// Mock IntersectionObserver (undefined in jsdom, used by some design-system components)
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

globalThis.IntersectionObserver = mockIntersectionObserver

const MOCK_ORG_ID = 'org-12345-abcde-67890'
const MOCK_API_KEY_ID = 'api-key-12345'
const MOCK_API_KEY_VALUE = '••••••••xyz'
const MOCK_API_KEY_PLAINTEXT_VALUE = 'secret-api-key-xyz'

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

// Router state carries the id to auto-reveal after a key is created
const mockLocation: { state: Record<string, string> | null } = { state: null }

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useLocation: () => mockLocation,
}))

// Mock hooks that require providers
jest.mock('~/hooks/useDeveloperTool', () => ({
  useDeveloperTool: () => ({ closePanel: jest.fn() }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: true }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => true }),
}))

const mockOrganizationData = {
  request: {
    query: GetOrganizationInfosForApiKeyDocument,
  },
  result: {
    data: {
      organization: {
        __typename: 'Organization',
        id: MOCK_ORG_ID,
        name: 'Test Organization',
        createdAt: '2024-01-01T00:00:00Z',
      },
    },
  },
}

const mockApiKeysData = {
  request: {
    query: GetApiKeysDocument,
    variables: { page: 1, limit: 20 },
  },
  result: {
    data: {
      apiKeys: {
        __typename: 'SanitizedApiKeyCollection',
        collection: [
          {
            // The list only ever returns sanitized keys, a distinct type from the
            // `ApiKey` returned by the value query, so the plaintext fetched for a copy
            // can never overwrite the masked value in the cache.
            __typename: 'SanitizedApiKey',
            id: MOCK_API_KEY_ID,
            name: 'Test API Key',
            value: MOCK_API_KEY_VALUE,
            createdAt: '2024-01-01T00:00:00Z',
            expiresAt: null,
            lastUsedAt: null,
          },
        ],
        metadata: {
          __typename: 'CollectionMetadata',
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
        },
      },
    },
  },
}

const mockApiKeyValueData = {
  request: {
    query: GetApiKeyValueDocument,
    variables: { id: MOCK_API_KEY_ID },
  },
  result: {
    data: {
      apiKey: {
        __typename: 'ApiKey',
        id: MOCK_API_KEY_ID,
        value: MOCK_API_KEY_PLAINTEXT_VALUE,
      },
    },
  },
}

const mockApiKeyValueError = {
  request: {
    query: GetApiKeyValueDocument,
    variables: { id: MOCK_API_KEY_ID },
  },
  error: new Error('Network error'),
}

// `MockedProvider` consumes one mock per call and the query is `no-cache`, so the value
// mock is listed twice for the tests that fetch it twice (copy, then reveal).
const renderComponent = (
  valueMocks: TestMocksType = [mockApiKeyValueData, mockApiKeyValueData],
) => {
  return render(<ApiKeys />, {
    wrapper: ({ children }) =>
      AllTheProviders({
        children,
        mocks: [mockOrganizationData, mockApiKeysData, ...valueMocks],
        forceTypenames: true,
      }),
  })
}

const getApiKeyRow = async (): Promise<HTMLElement> => {
  const valueCell = await screen.findByText(MOCK_API_KEY_VALUE)
  const row = valueCell.closest('tr')

  if (!row) throw new Error('API key row not found')

  return row
}

describe('ApiKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocation.state = null
  })

  it('should show masked organization ID by default', async () => {
    renderComponent()

    const maskedId = maskValue(MOCK_ORG_ID, { dotsCount: 8, visibleChars: 3 })

    await waitFor(() => {
      expect(screen.getByText(maskedId)).toBeInTheDocument()
    })
  })

  it('should display API key value in table', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(MOCK_API_KEY_VALUE)).toBeInTheDocument()
    })
  })

  describe('GIVEN a masked API key', () => {
    describe('WHEN clicking the inline copy button', () => {
      it('THEN should copy the plaintext value without revealing it', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(copyToClipboard).toHaveBeenCalledWith(MOCK_API_KEY_PLAINTEXT_VALUE)
        })

        expect(screen.queryByText(MOCK_API_KEY_PLAINTEXT_VALUE)).not.toBeInTheDocument()
        expect(screen.getByText(MOCK_API_KEY_VALUE)).toBeInTheDocument()
      })
    })

    describe('WHEN clicking the copy action in the action menu', () => {
      it('THEN should copy the plaintext value without revealing it', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
        fireEvent.click(await screen.findByTestId(API_KEY_COPY_ACTION_TEST_ID))

        await waitFor(() => {
          expect(copyToClipboard).toHaveBeenCalledWith(MOCK_API_KEY_PLAINTEXT_VALUE)
        })

        expect(screen.queryByText(MOCK_API_KEY_PLAINTEXT_VALUE)).not.toBeInTheDocument()
      })
    })

    describe('WHEN clicking the reveal button', () => {
      it('THEN should display the plaintext value', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(API_KEY_REVEAL_BUTTON_TEST_ID))

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()
        expect(copyToClipboard).not.toHaveBeenCalled()
      })
    })

    describe('WHEN copying the key and then revealing it', () => {
      it('THEN should reveal the value the copy left masked', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(copyToClipboard).toHaveBeenCalledWith(MOCK_API_KEY_PLAINTEXT_VALUE)
        })

        expect(screen.queryByText(MOCK_API_KEY_PLAINTEXT_VALUE)).not.toBeInTheDocument()

        fireEvent.click(within(row).getByTestId(API_KEY_REVEAL_BUTTON_TEST_ID))

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()
      })
    })

    describe('WHEN revealing then clicking the reveal button again', () => {
      it('THEN should mask the value back', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(API_KEY_REVEAL_BUTTON_TEST_ID))

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()

        fireEvent.click(within(row).getByTestId(API_KEY_REVEAL_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(screen.queryByText(MOCK_API_KEY_PLAINTEXT_VALUE)).not.toBeInTheDocument()
        })

        expect(screen.getByText(MOCK_API_KEY_VALUE)).toBeInTheDocument()
      })
    })

    describe('WHEN using the reveal action in the action menu', () => {
      it('THEN should reveal the value', async () => {
        renderComponent()

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(OPEN_ACTION_BUTTON_TEST_ID))
        fireEvent.click(await screen.findByTestId(API_KEY_REVEAL_ACTION_TEST_ID))

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()
      })
    })

    describe('WHEN redirected here with a key id to reveal', () => {
      it('THEN should reveal that key on mount', async () => {
        mockLocation.state = { [STATE_KEY_ID_TO_REVEAL]: MOCK_API_KEY_ID }

        renderComponent()

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()
      })
    })

    describe('WHEN the value query fails', () => {
      it('THEN should show an error toast and copy nothing', async () => {
        renderComponent([mockApiKeyValueError])

        const row = await getApiKeyRow()

        fireEvent.click(within(row).getByTestId(TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith({
            severity: 'danger',
            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
          })
        })

        expect(copyToClipboard).not.toHaveBeenCalled()
        expect(screen.getByText(MOCK_API_KEY_VALUE)).toBeInTheDocument()
      })
    })
  })
})
