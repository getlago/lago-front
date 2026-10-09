import { act, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import { FormDrawerProps } from '~/components/drawers/FormDrawer'
import { ComboBoxProps } from '~/components/form/ComboBox/types'
import { MappableTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { XeroIntegrationMapItemDrawerProps } from '../types'
import { useXeroIntegrationMapItemDrawer } from '../useXeroIntegrationMapItemDrawer'

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

const SEEDED_ITEM = { externalId: 'ext-1', externalName: 'Sales', externalAccountCode: '200' }
const OTHER_ITEM = { externalId: 'ext-2', externalName: 'Services', externalAccountCode: '300' }

jest.mock('../useXeroIntegrationMappingCRUD', () => ({
  useXeroIntegrationMappingCRUD: (...args: unknown[]) => {
    mockCRUDArgs(...args)

    return {
      createCollectionMapping: jest.fn(),
      createMapping: mockCreateMapping,
      deleteCollectionMapping: jest.fn(),
      deleteMapping: mockDeleteMapping,
      updateCollectionMapping: jest.fn(),
      updateMapping: mockUpdateMapping,
      getXeroIntegrationItems: jest.fn(),
      initialItemFetchLoading: false,
      initialItemFetchData: {
        integrationItems: {
          collection: [
            { id: 'item-1', ...SEEDED_ITEM },
            { id: 'item-2', ...OTHER_ITEM },
          ],
        },
      },
      accountItemsLoading: false,
      itemsLoading: false,
      triggerAccountItemRefetch: jest.fn(),
      triggerItemRefetch: jest.fn(),
    }
  },
}))

const OPEN_BUTTON_TEST_ID = 'open-xero-map-item-drawer'
const INTEGRATION_ID = 'integration-1'
const DEFAULT_MAPPING_ID = 'mapping-default'

const DRAWER_PROPS: XeroIntegrationMapItemDrawerProps = {
  type: MappableTypeEnum.AddOn,
  integrationId: INTEGRATION_ID,
  billingEntities: [{ id: null, key: 'default', name: 'Default' }],
  itemMappings: {
    default: {
      itemId: DEFAULT_MAPPING_ID,
      itemExternalId: SEEDED_ITEM.externalId,
      itemExternalName: SEEDED_ITEM.externalName,
      itemExternalCode: SEEDED_ITEM.externalAccountCode,
      lagoMappableId: 'addon-1',
      lagoMappableName: 'Add-on',
    },
  },
}

type DrawerPayload = FormDrawerProps

const DrawerHost = () => {
  const { openDrawer } = useXeroIntegrationMapItemDrawer()

  return (
    <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(DRAWER_PROPS)}>
      open
    </button>
  )
}

const getComboBoxInput = (): HTMLInputElement =>
  document.querySelector('input[name="default.selectedElementValue"]') as HTMLInputElement

const openDrawerAndRenderBody = async (): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<DrawerHost />)

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

describe('useXeroIntegrationMapItemDrawer', () => {
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

        expect(getComboBoxInput()).toHaveValue('Sales (200)')
      })

      it('THEN should scope the CRUD hook to the opened type and integration', async () => {
        await openDrawerAndRenderBody()

        expect(mockCRUDArgs).toHaveBeenCalledWith(MappableTypeEnum.AddOn, INTEGRATION_ID)
      })
    })

    describe('WHEN another item is selected and the form is submitted', () => {
      it('THEN should update the mapping with the selected item', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.click(getComboBoxInput())
        await user.click(await screen.findByRole('option', { name: /Services/ }))
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockUpdateMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              id: DEFAULT_MAPPING_ID,
              externalId: OTHER_ITEM.externalId,
              externalName: OTHER_ITEM.externalName,
              externalAccountCode: OTHER_ITEM.externalAccountCode,
            }),
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
})
