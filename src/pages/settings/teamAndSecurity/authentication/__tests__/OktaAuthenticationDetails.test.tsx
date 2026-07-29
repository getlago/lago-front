import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_NAME,
  FORM_DIALOG_OPENING_DIALOG_NAME,
} from '~/components/dialogs/const'
import FormDialogOpeningDialog from '~/components/dialogs/FormDialogOpeningDialog'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { initializeTranslations } from '~/core/apolloClient'
import { GetOktaIntegrationDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import OktaAuthenticationDetails from '../OktaAuthenticationDetails'
import {
  SSO_DETAILS_ACTIONS_TEST_ID,
  SSO_DETAILS_DELETE_TEST_ID,
  SSO_DETAILS_EDIT_TEST_ID,
  SSO_DETAILS_INLINE_EDIT_TEST_ID,
} from '../SSOAuthenticationDetails'

const mockNavigateFn = jest.fn()
const mockUseParams = jest.fn().mockReturnValue({ integrationId: 'integration-123' })

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigateFn,
  useParams: () => mockUseParams(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    organization: {
      authenticationMethods: ['email_password', 'okta'],
    },
  }),
}))

NiceModal.register(FORM_DIALOG_OPENING_DIALOG_NAME, FormDialogOpeningDialog)
NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

const NiceModalWrapper = ({ children }: { children: ReactNode }) => {
  return <NiceModal.Provider>{children}</NiceModal.Provider>
}

const integrationData = {
  id: 'integration-123',
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  code: 'okta',
  organizationName: 'test-org',
  domain: 'test.example.com',
  name: 'My Okta Integration',
  host: 'okta.example.com',
  __typename: 'OktaIntegration' as const,
}

const successMocks: TestMocksType = [
  {
    request: {
      query: GetOktaIntegrationDocument,
      variables: { id: 'integration-123' },
    },
    result: {
      data: {
        integration: integrationData,
      },
    },
  },
]

async function prepare({ mocks = successMocks }: { mocks?: TestMocksType } = {}) {
  await act(() =>
    render(
      <NiceModalWrapper>
        <MainHeader />
        <OktaAuthenticationDetails />
      </NiceModalWrapper>,
      { mocks },
    ),
  )
}

describe('OktaAuthenticationDetails', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ integrationId: 'integration-123' })
  })

  afterEach(cleanup)

  it('renders integration details after loading', async () => {
    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    expect(screen.getByText('okta.example.com')).toBeInTheDocument()
    expect(screen.getByText('test-client-id')).toBeInTheDocument()
    expect(screen.getByText('test-client-secret')).toBeInTheDocument()
    expect(screen.getByText('test-org')).toBeInTheDocument()
  })

  it('renders the page header with back button', async () => {
    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    const backButton = document.querySelector('a[href*="authentication"]')

    expect(backButton).toBeInTheDocument()
  })

  it('shows N/A for missing host', async () => {
    const noHostMocks: TestMocksType = [
      {
        request: {
          query: GetOktaIntegrationDocument,
          variables: { id: 'integration-123' },
        },
        result: {
          data: {
            integration: {
              ...integrationData,
              host: null,
            },
          },
        },
      },
    ]

    await prepare({ mocks: noHostMocks })

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  it('shows N/A for missing clientId', async () => {
    const noClientIdMocks: TestMocksType = [
      {
        request: {
          query: GetOktaIntegrationDocument,
          variables: { id: 'integration-123' },
        },
        result: {
          data: {
            integration: {
              ...integrationData,
              clientId: null,
            },
          },
        },
      },
    ]

    await prepare({ mocks: noClientIdMocks })

    await waitFor(() => {
      expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('navigates away when integration is not found', async () => {
    const emptyMocks: TestMocksType = [
      {
        request: {
          query: GetOktaIntegrationDocument,
          variables: { id: 'integration-123' },
        },
        result: {
          data: {
            integration: null,
          },
        },
      },
    ]

    await prepare({ mocks: emptyMocks })

    await waitFor(() => {
      expect(mockNavigateFn).toHaveBeenCalled()
    })
  })

  it('does not navigate away while the integration query is still loading', async () => {
    const delayedMocks: TestMocksType = [
      {
        request: {
          query: GetOktaIntegrationDocument,
          variables: { id: 'integration-123' },
        },
        result: {
          data: {
            integration: integrationData,
          },
        },
        delay: 1000,
      },
    ]

    await act(() =>
      render(
        <NiceModalWrapper>
          <OktaAuthenticationDetails />
        </NiceModalWrapper>,
        { mocks: delayedMocks },
      ),
    )

    // Query is still in flight (1s delay): the page must not bounce back to the list.
    expect(mockNavigateFn).not.toHaveBeenCalled()
  })

  it('renders the actions dropdown button', async () => {
    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    expect(screen.getByTestId(SSO_DETAILS_ACTIONS_TEST_ID)).toBeInTheDocument()
  })

  it('opens the actions popper with edit and delete entries', async () => {
    const user = userEvent.setup()

    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId(SSO_DETAILS_ACTIONS_TEST_ID))

    expect(await screen.findByTestId(SSO_DETAILS_EDIT_TEST_ID)).toBeInTheDocument()
    expect(screen.getByTestId(SSO_DETAILS_DELETE_TEST_ID)).toBeInTheDocument()
  })

  it('has all 5 detail items visible', async () => {
    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    // All detail items should be present
    expect(screen.getByText('okta.example.com')).toBeInTheDocument()
    expect(screen.getByText('test-client-id')).toBeInTheDocument()
    expect(screen.getByText('test-client-secret')).toBeInTheDocument()
    expect(screen.getByText('test-org')).toBeInTheDocument()
  })

  it('clicks edit button in actions popper to open edit dialog', async () => {
    const user = userEvent.setup()

    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId(SSO_DETAILS_ACTIONS_TEST_ID))
    await user.click(await screen.findByTestId(SSO_DETAILS_EDIT_TEST_ID))

    await waitFor(() => {
      expect(document.querySelector('[class*="MuiDialog"]')).toBeInTheDocument()
    })
  })

  it('clicks delete button in actions popper to open delete dialog', async () => {
    const user = userEvent.setup()

    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId(SSO_DETAILS_ACTIONS_TEST_ID))
    await user.click(await screen.findByTestId(SSO_DETAILS_DELETE_TEST_ID))

    await waitFor(() => {
      expect(document.querySelector('[class*="MuiDialog"]')).toBeInTheDocument()
    })
  })

  it('shows inline edit button and opens dialog when clicked', async () => {
    const user = userEvent.setup()

    await prepare()

    await waitFor(() => {
      expect(screen.getByText('test.example.com')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId(SSO_DETAILS_INLINE_EDIT_TEST_ID))

    await waitFor(() => {
      expect(document.querySelector('[class*="MuiDialog"]')).toBeInTheDocument()
    })
  })
})
