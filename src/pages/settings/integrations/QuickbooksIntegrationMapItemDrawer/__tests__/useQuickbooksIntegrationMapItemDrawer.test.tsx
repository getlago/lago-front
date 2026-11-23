import { act, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import { FormDrawerProps } from '~/components/drawers/FormDrawer'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { MappableTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { toQuickbooksOption } from '../toQuickbooksOption'
import { QuickbooksIntegrationMapItemDrawerProps } from '../types'
import { useQuickbooksIntegrationMapItemDrawer } from '../useQuickbooksIntegrationMapItemDrawer'

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

const mockCreateMapping = jest.fn()
const mockUpdateMapping = jest.fn()
const mockDeleteMapping = jest.fn()
const mockCRUDArgs = jest.fn()

const mockItemsArgs = jest.fn()

// QuickBooks items and accounts carry no account code.
const SEEDED_ITEM = { externalId: 'ext-1', externalName: 'Sales' }
const OTHER_ITEM = { externalId: 'ext-2', externalName: 'Services' }

const mockComboboxData = [SEEDED_ITEM, OTHER_ITEM].map(toQuickbooksOption)

jest.mock('../useQuickbooksIntegrationMappingCRUD', () => ({
  useQuickbooksIntegrationMappingCRUD: (...args: unknown[]) => {
    mockCRUDArgs(...args)

    return {
      createCollectionMapping: jest.fn(),
      createMapping: mockCreateMapping,
      deleteCollectionMapping: jest.fn(),
      deleteMapping: mockDeleteMapping,
      updateCollectionMapping: jest.fn(),
      updateMapping: mockUpdateMapping,
    }
  },
}))

jest.mock('../useQuickbooksIntegrationItems', () => ({
  useQuickbooksIntegrationItems: (...args: unknown[]) => {
    mockItemsArgs(...args)

    return {
      items: mockComboboxData,
      isLoading: false,
      refresh: jest.fn(),
    }
  },
  useQuickbooksIntegrationItemSearch: () => ({
    searchResults: [],
    isSearching: false,
    isLoading: false,
    search: undefined,
  }),
}))

const OPEN_BUTTON_TEST_ID = 'open-quickbooks-map-item-drawer'
const INTEGRATION_ID = 'integration-1'
const DEFAULT_MAPPING_ID = 'mapping-default'

const DRAWER_PROPS: QuickbooksIntegrationMapItemDrawerProps = {
  type: MappableTypeEnum.AddOn,
  integrationId: INTEGRATION_ID,
  billingEntities: [{ id: null, key: 'default', name: 'Default' }],
  itemMappings: {
    default: {
      itemId: DEFAULT_MAPPING_ID,
      itemExternalId: SEEDED_ITEM.externalId,
      itemExternalName: SEEDED_ITEM.externalName,
      itemExternalCode: undefined,
      lagoMappableId: 'addon-1',
      lagoMappableName: 'Add-on',
    },
  },
}

type DrawerPayload = FormDrawerProps

const UNMAPPED_DRAWER_PROPS: QuickbooksIntegrationMapItemDrawerProps = {
  ...DRAWER_PROPS,
  itemMappings: {
    default: {
      itemId: null,
      itemExternalId: null,
      itemExternalName: undefined,
      itemExternalCode: undefined,
      lagoMappableId: 'addon-1',
      lagoMappableName: 'Add-on',
    },
  },
}

const DrawerHost = ({ drawerProps }: { drawerProps: QuickbooksIntegrationMapItemDrawerProps }) => {
  const { openDrawer } = useQuickbooksIntegrationMapItemDrawer()

  return (
    <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(drawerProps)}>
      open
    </button>
  )
}

const getComboBoxInput = (): HTMLInputElement =>
  document.querySelector('input[name="default.selectedElementValue"]') as HTMLInputElement

const openDrawerAndRenderBody = async (
  drawerProps: QuickbooksIntegrationMapItemDrawerProps = DRAWER_PROPS,
): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<DrawerHost drawerProps={drawerProps} />)

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  const payload = mockOpen.mock.calls.at(-1)?.[0] as DrawerPayload

  render(<>{payload.children}</>)

  return { payload, user }
}

const submit = async (payload: DrawerPayload): Promise<void> => {
  await act(async () => {
    await payload.form.submit()
  })
}

describe('useQuickbooksIntegrationMapItemDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMapping.mockResolvedValue({})
    mockUpdateMapping.mockResolvedValue({})
    mockDeleteMapping.mockResolvedValue({})
  })

  describe('GIVEN an existing mapping', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN should preselect the mapped item', async () => {
        await openDrawerAndRenderBody()

        expect(getComboBoxInput()).toHaveValue('Sales')
      })

      it('THEN should scope the CRUD hook to the opened type', async () => {
        await openDrawerAndRenderBody()

        expect(mockCRUDArgs).toHaveBeenCalledWith(MappableTypeEnum.AddOn)
      })

      it('THEN should scope the items query to the opened type and integration', async () => {
        await openDrawerAndRenderBody()

        expect(mockItemsArgs).toHaveBeenCalledWith(MappableTypeEnum.AddOn, INTEGRATION_ID)
      })
    })

    describe('WHEN another item is selected and the form is submitted', () => {
      it('THEN should update the mapping with the selected item, sending no account code', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.click(getComboBoxInput())
        await user.click(await screen.findByRole('option', { name: /Services/ }))
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockUpdateMapping).toHaveBeenCalledWith({
          variables: {
            input: {
              id: DEFAULT_MAPPING_ID,
              integrationId: INTEGRATION_ID,
              mappableType: MappableTypeEnum.AddOn,
              mappableId: 'addon-1',
              externalId: OTHER_ITEM.externalId,
              externalName: OTHER_ITEM.externalName,
            },
          },
        })
      })
    })

    describe('WHEN the selection is cleared and the form is submitted', () => {
      it('THEN should delete the mapping', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.click(
          document.querySelector('.MuiAutocomplete-clearIndicator') as HTMLButtonElement,
        )
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockDeleteMapping).toHaveBeenCalledWith({
          variables: { input: { id: DEFAULT_MAPPING_ID } },
        })
      })
    })
  })

  describe('GIVEN an unmapped add-on', () => {
    describe('WHEN an item is selected and the form is submitted', () => {
      it('THEN should create the mapping with the item id and name only', async () => {
        const { payload, user } = await openDrawerAndRenderBody(UNMAPPED_DRAWER_PROPS)

        await user.click(getComboBoxInput())
        await user.click(await screen.findByRole('option', { name: /Services/ }))
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockCreateMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              integrationId: INTEGRATION_ID,
              mappableType: MappableTypeEnum.AddOn,
              mappableId: 'addon-1',
              externalId: OTHER_ITEM.externalId,
              externalName: OTHER_ITEM.externalName,
            }),
          },
        })
        expect(mockCreateMapping.mock.calls[0][0].variables.input).not.toHaveProperty(
          'externalAccountCode',
        )
      })
    })
  })
})
