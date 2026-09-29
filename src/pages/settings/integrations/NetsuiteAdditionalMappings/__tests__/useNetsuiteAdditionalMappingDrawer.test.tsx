import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { ReactNode } from 'react'

import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { CurrencyEnum, MappingTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID,
  netsuiteCurrencyCodeTestId,
  netsuiteCurrencyMappingRowTestId,
  removeNetsuiteCurrencyMappingTestId,
} from '../NetsuiteAdditionalMappingForm'
import { NetsuiteAdditionalMappingDrawerProps } from '../types'
import { useNetsuiteAdditionalMappingDrawer } from '../useNetsuiteAdditionalMappingDrawer'

// The virtualized listbox renders no option under jsdom (zero-height container)
jest.mock('~/components/form/ComboBox/ComboBox', () => {
  const { ComboBox } = jest.requireActual('~/components/form/ComboBox/ComboBox')

  return { ComboBox: (props: ComboBoxProps) => <ComboBox {...props} virtualized={false} /> }
})

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

const mockCreateCollectionMapping = jest.fn()
const mockUpdateCollectionMapping = jest.fn()
const mockDeleteCollectionMapping = jest.fn()

jest.mock('../useNetsuiteAdditionalMappingsCUD', () => ({
  useNetsuiteAdditionalMappingsCUD: () => ({
    createCollectionMapping: mockCreateCollectionMapping,
    updateCollectionMapping: mockUpdateCollectionMapping,
    deleteCollectionMapping: mockDeleteCollectionMapping,
  }),
}))

const INTEGRATION_ID = 'integration-1'
const ITEM_ID = 'collection-mapping-1'
const OPEN_BUTTON_TEST_ID = 'open-netsuite-additional-mapping-drawer'

const seededMapping = {
  __typename: 'CurrencyMappingItem' as const,
  currencyCode: CurrencyEnum.Eur,
  currencyExternalCode: 'EUR-EXT',
}

type DrawerPayload = {
  children: ReactNode
  mainAction: ReactNode
  form: { id: string; submit: () => void }
  closeOnSubmitSuccess: boolean
  shouldPromptOnClose: () => boolean
  onClose: () => void
}

const DrawerHost = ({ params }: { params: NetsuiteAdditionalMappingDrawerProps }) => {
  const { openDrawer } = useNetsuiteAdditionalMappingDrawer()

  return (
    <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(params)}>
      open
    </button>
  )
}

const lastDrawerPayload = (): DrawerPayload => mockOpen.mock.calls.at(-1)?.[0] as DrawerPayload

const openDrawerAndRenderBody = async (
  params: Partial<NetsuiteAdditionalMappingDrawerProps> = {},
): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(
    <DrawerHost
      params={{
        type: MappingTypeEnum.Currencies,
        integrationId: INTEGRATION_ID,
        ...params,
      }}
    />,
  )

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  const payload = lastDrawerPayload()

  render(
    <>
      {payload.children}
      {payload.mainAction}
    </>,
  )

  return { payload, user }
}

const typeExternalCode = async (user: UserEvent, index: number, value: string): Promise<void> => {
  const row = screen.getByTestId(netsuiteCurrencyMappingRowTestId(index))

  await user.type(within(row).getByRole('textbox'), value)
}

const selectCurrency = async (
  user: UserEvent,
  index: number,
  currency: CurrencyEnum,
): Promise<void> => {
  const combobox = screen.getByTestId(netsuiteCurrencyCodeTestId(index))
  const input = combobox.querySelector('input') as HTMLInputElement

  await user.click(input)
  await user.keyboard(currency)
  await user.click(await screen.findByRole('option'))
}

describe('useNetsuiteAdditionalMappingDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateCollectionMapping.mockResolvedValue({})
    mockUpdateCollectionMapping.mockResolvedValue({})
    mockDeleteCollectionMapping.mockResolvedValue({})
  })

  describe('GIVEN the drawer is opened', () => {
    describe('WHEN no mapping exists yet', () => {
      it('THEN should open a form drawer that owns its own closing', async () => {
        await openDrawerAndRenderBody()

        expect(mockOpen).toHaveBeenCalledTimes(1)
        expect(lastDrawerPayload().closeOnSubmitSuccess).toBe(false)
        expect(lastDrawerPayload().form.id).toBe('netsuite-additional-mapping-drawer-form')
      })

      it('THEN should render no mapping row', async () => {
        await openDrawerAndRenderBody()

        expect(screen.queryByTestId(netsuiteCurrencyMappingRowTestId(0))).not.toBeInTheDocument()
      })
    })

    describe('WHEN the mapping already holds currencies', () => {
      it('THEN should seed one row per currency', async () => {
        await openDrawerAndRenderBody({ itemId: ITEM_ID, mappings: [seededMapping] })

        expect(screen.getByTestId(netsuiteCurrencyMappingRowTestId(0))).toBeInTheDocument()
        expect(
          within(screen.getByTestId(netsuiteCurrencyMappingRowTestId(0))).getByRole('textbox'),
        ).toHaveValue('EUR-EXT')
      })
    })
  })

  describe('GIVEN a drawer opened without an existing mapping', () => {
    describe('WHEN a complete row is submitted', () => {
      it('THEN should create the mapping and close the drawer', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.click(screen.getByTestId(ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID))
        await selectCurrency(user, 0, CurrencyEnum.Usd)
        await typeExternalCode(user, 0, 'USD-EXT')

        payload.form.submit()

        await waitFor(() =>
          expect(mockCreateCollectionMapping).toHaveBeenCalledWith({
            variables: {
              input: {
                integrationId: INTEGRATION_ID,
                mappingType: MappingTypeEnum.Currencies,
                currencies: [{ currencyCode: CurrencyEnum.Usd, currencyExternalCode: 'USD-EXT' }],
              },
            },
          }),
        )
        expect(mockClose).toHaveBeenCalled()
      })
    })

    describe('WHEN a row is left incomplete', () => {
      it('THEN should neither call a mutation nor close the drawer', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.click(screen.getByTestId(ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID))

        payload.form.submit()

        await waitFor(() => expect(mockCreateCollectionMapping).not.toHaveBeenCalled())
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a drawer opened on an existing mapping', () => {
    describe('WHEN a row is added on top of the seeded ones', () => {
      it('THEN should update the mapping with every row', async () => {
        const { payload, user } = await openDrawerAndRenderBody({
          itemId: ITEM_ID,
          mappings: [seededMapping],
        })

        await user.click(screen.getByTestId(ADD_NETSUITE_CURRENCY_MAPPING_TEST_ID))
        await selectCurrency(user, 1, CurrencyEnum.Usd)
        await typeExternalCode(user, 1, 'USD-EXT')

        payload.form.submit()

        await waitFor(() =>
          expect(mockUpdateCollectionMapping).toHaveBeenCalledWith({
            variables: {
              input: {
                id: ITEM_ID,
                integrationId: INTEGRATION_ID,
                mappingType: MappingTypeEnum.Currencies,
                currencies: [
                  { currencyCode: CurrencyEnum.Eur, currencyExternalCode: 'EUR-EXT' },
                  { currencyCode: CurrencyEnum.Usd, currencyExternalCode: 'USD-EXT' },
                ],
              },
            },
          }),
        )
        expect(mockClose).toHaveBeenCalled()
      })
    })

    describe('WHEN every row is removed', () => {
      it('THEN should delete the mapping instead of updating it', async () => {
        const { payload, user } = await openDrawerAndRenderBody({
          itemId: ITEM_ID,
          mappings: [seededMapping],
        })

        await user.click(screen.getByTestId(removeNetsuiteCurrencyMappingTestId(0)))

        payload.form.submit()

        await waitFor(() =>
          expect(mockDeleteCollectionMapping).toHaveBeenCalledWith({
            variables: { input: { id: ITEM_ID } },
          }),
        )
        expect(mockUpdateCollectionMapping).not.toHaveBeenCalled()
        expect(mockClose).toHaveBeenCalled()
      })
    })

    describe('WHEN the mutation comes back with errors', () => {
      it('THEN should keep the drawer open', async () => {
        mockUpdateCollectionMapping.mockResolvedValue({ errors: [new Error('nope')] })

        const { payload, user } = await openDrawerAndRenderBody({
          itemId: ITEM_ID,
          mappings: [seededMapping],
        })

        await typeExternalCode(user, 0, '-2')

        payload.form.submit()

        await waitFor(() => expect(mockUpdateCollectionMapping).toHaveBeenCalled())
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a drawer opened on a mapping type it does not handle', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should not call any mutation', async () => {
        const { payload } = await openDrawerAndRenderBody({ type: MappingTypeEnum.Coupon })

        payload.form.submit()

        await waitFor(() => expect(mockCreateCollectionMapping).not.toHaveBeenCalled())
        expect(mockUpdateCollectionMapping).not.toHaveBeenCalled()
        expect(mockDeleteCollectionMapping).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the unsaved-changes prompt', () => {
    describe('WHEN nothing has been edited', () => {
      it('THEN should not prompt on close', async () => {
        const { payload } = await openDrawerAndRenderBody({
          itemId: ITEM_ID,
          mappings: [seededMapping],
        })

        expect(payload.shouldPromptOnClose()).toBe(false)
      })
    })

    describe('WHEN a row has been edited', () => {
      it('THEN should prompt on close', async () => {
        const { payload, user } = await openDrawerAndRenderBody({
          itemId: ITEM_ID,
          mappings: [seededMapping],
        })

        await typeExternalCode(user, 0, '-2')

        expect(payload.shouldPromptOnClose()).toBe(true)
      })
    })
  })
})
