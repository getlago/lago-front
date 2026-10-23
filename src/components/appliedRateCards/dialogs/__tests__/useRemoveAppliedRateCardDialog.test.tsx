import { DocumentNode, gql, InMemoryCache } from '@apollo/client'
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import CentralizedDialog from '~/components/dialogs/CentralizedDialog'
import {
  CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID,
  CENTRALIZED_DIALOG_NAME,
} from '~/components/dialogs/const'
import { addToast } from '~/core/apolloClient'
import {
  DestroyContractAppliedRateCardDocument,
  DestroyPlanAppliedRateCardDocument,
} from '~/generated/graphql'

import { useRemoveAppliedRateCardDialog } from '../useRemoveAppliedRateCardDialog'

configure({ testIdAttribute: 'data-test' })

NiceModal.register(CENTRALIZED_DIALOG_NAME, CentralizedDialog)

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

const OPEN_DIALOG_BUTTON_TEST_ID = 'open-remove-applied-rate-card-dialog'

const TestComponent = ({
  context,
  onRemoved,
}: {
  context: 'plan' | 'contract'
  onRemoved?: () => void
}) => {
  const { openRemoveAppliedRateCardDialog } = useRemoveAppliedRateCardDialog()

  return (
    <button
      data-test={OPEN_DIALOG_BUTTON_TEST_ID}
      onClick={() =>
        openRemoveAppliedRateCardDialog(
          context === 'plan'
            ? { context: 'plan', id: 'applied-1', rateCardName: 'Enterprise', onRemoved }
            : { context: 'contract', id: 'applied-1', rateCardName: 'Enterprise', onRemoved },
        )
      }
    >
      open
    </button>
  )
}

const renderDialog = (
  context: 'plan' | 'contract',
  mocks: MockedResponse[],
  onRemoved?: () => void,
  cache?: InMemoryCache,
) =>
  render(
    <MockedProvider
      mocks={mocks}
      addTypename={false}
      cache={cache}
      defaultOptions={{ mutate: { errorPolicy: 'all' } }}
    >
      <NiceModal.Provider>
        <TestComponent context={context} onRemoved={onRemoved} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

const CACHED_PLAN_CARD_DETAILS = gql`
  query cachedPlanAppliedRateCardDetails($id: ID!) {
    planAppliedRateCard(id: $id) {
      __typename
      id
    }
  }
`

const CACHED_CONTRACT_CARD_DETAILS = gql`
  query cachedContractAppliedRateCardDetails($id: ID!) {
    contractAppliedRateCard(id: $id) {
      __typename
      id
    }
  }
`

const openDialogAndConfirm = async () => {
  await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))
  await userEvent.click(await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID))
}

describe('useRemoveAppliedRateCardDialog', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  it('opens a danger dialog naming the rate card', async () => {
    renderDialog('plan', [])

    await userEvent.click(screen.getByTestId(OPEN_DIALOG_BUTTON_TEST_ID))

    const confirmButton = await screen.findByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID)

    expect(screen.getByText('text_1790283913718mpxv4h76ne5|Enterprise')).toBeInTheDocument()
    expect(screen.getByText('text_1790283913718aiyuge7g45l')).toBeInTheDocument()
    expect(confirmButton).toHaveClass('button-danger')
    expect(confirmButton).toHaveTextContent('text_1790283913718ou6jmxoxnea')
  })

  it('destroys a plan-applied rate card, runs onRemoved and toasts', async () => {
    const onRemoved = jest.fn()

    renderDialog(
      'plan',
      [
        {
          request: {
            query: DestroyPlanAppliedRateCardDocument,
            variables: { input: { id: 'applied-1' } },
          },
          result: { data: { destroyPlanAppliedRateCard: { id: 'applied-1' } } },
        },
      ],
      onRemoved,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1))
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_1790283913718436odi8om57',
      severity: 'success',
    })
  })

  it('destroys a contract-applied rate card, runs onRemoved and toasts', async () => {
    const onRemoved = jest.fn()

    renderDialog(
      'contract',
      [
        {
          request: {
            query: DestroyContractAppliedRateCardDocument,
            variables: { input: { id: 'applied-1' } },
          },
          result: { data: { destroyContractAppliedRateCard: { id: 'applied-1' } } },
        },
      ],
      onRemoved,
    )

    await openDialogAndConfirm()

    await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1))
    expect(addToast).toHaveBeenCalledWith({
      message: 'text_1790283913718436odi8om57',
      severity: 'success',
    })
  })

  // Guards a removed card rendering again from cache when its details URL is revisited.
  it.each<{
    context: 'plan' | 'contract'
    typename: string
    rootField: string
    detailsQuery: DocumentNode
    mock: MockedResponse
  }>([
    {
      context: 'plan',
      typename: 'PlanAppliedRateCard',
      rootField: 'planAppliedRateCard',
      detailsQuery: CACHED_PLAN_CARD_DETAILS,
      mock: {
        request: {
          query: DestroyPlanAppliedRateCardDocument,
          variables: { input: { id: 'applied-1' } },
        },
        result: { data: { destroyPlanAppliedRateCard: { id: 'applied-1' } } },
      },
    },
    {
      context: 'contract',
      typename: 'ContractAppliedRateCard',
      rootField: 'contractAppliedRateCard',
      detailsQuery: CACHED_CONTRACT_CARD_DETAILS,
      mock: {
        request: {
          query: DestroyContractAppliedRateCardDocument,
          variables: { input: { id: 'applied-1' } },
        },
        result: { data: { destroyContractAppliedRateCard: { id: 'applied-1' } } },
      },
    },
  ])(
    'GIVEN a cached $context card details WHEN the card is removed THEN its details read null and the card leaves the cache',
    async ({ context, typename, rootField, detailsQuery, mock }) => {
      const cache = new InMemoryCache({ addTypename: false })
      const onRemoved = jest.fn()

      cache.writeQuery({
        query: detailsQuery,
        variables: { id: 'applied-1' },
        data: { [rootField]: { __typename: typename, id: 'applied-1' } },
      })

      renderDialog(context, [mock], onRemoved, cache)

      await openDialogAndConfirm()

      await waitFor(() => expect(onRemoved).toHaveBeenCalledTimes(1))
      expect(cache.readQuery({ query: detailsQuery, variables: { id: 'applied-1' } })).toEqual({
        [rootField]: null,
      })
      expect(cache.extract()).not.toHaveProperty(`${typename}:applied-1`)
    },
  )

  it('does nothing beyond the mutation when the backend rejects the removal', async () => {
    const onRemoved = jest.fn()

    renderDialog(
      'plan',
      [
        {
          request: {
            query: DestroyPlanAppliedRateCardDocument,
            variables: { input: { id: 'applied-1' } },
          },
          result: {
            data: null,
            errors: [new GraphQLError('Cannot remove', { extensions: { code: 'forbidden' } })],
          },
        },
      ],
      onRemoved,
    )

    await openDialogAndConfirm()

    await waitFor(() => {
      expect(
        screen.queryByTestId(CENTRALIZED_DIALOG_CONFIRM_BUTTON_TEST_ID),
      ).not.toBeInTheDocument()
    })

    expect(onRemoved).not.toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalled()
  })
})
