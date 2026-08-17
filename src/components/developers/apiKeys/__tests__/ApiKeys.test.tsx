import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { TYPOGRAPHY_WITH_COPY_BUTTON_TEST_ID } from '~/components/designSystem/TypographyWithCopy'
import { maskValue } from '~/core/formats/maskValue'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  GetApiKeysDocument,
  GetApiKeyValueDocument,
  GetOrganizationInfosForApiKeyDocument,
} from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import { ApiKeys } from '../ApiKeys'
import { API_KEY_COPY_ACTION_TEST_ID } from '../dataTestConstants'

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

const renderComponent = () => {
  return render(<ApiKeys />, {
    wrapper: ({ children }) =>
      AllTheProviders({
        children,
        // The value query is mocked twice: MockedProvider consumes a mock per call, and
        // some tests fetch the value more than once (copy, then reveal).
        mocks: [mockOrganizationData, mockApiKeysData, mockApiKeyValueData, mockApiKeyValueData],
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
        const revealButton = within(row)
          .getByTestId(/^eye\//)
          .closest('button')

        expect(revealButton).not.toBeNull()

        fireEvent.click(revealButton as HTMLElement)

        expect(await screen.findByText(MOCK_API_KEY_PLAINTEXT_VALUE)).toBeInTheDocument()
        expect(copyToClipboard).not.toHaveBeenCalled()
      })
    })
  })
})
