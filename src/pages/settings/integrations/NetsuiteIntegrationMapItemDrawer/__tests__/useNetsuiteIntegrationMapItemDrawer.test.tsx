import { act, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import { FormDrawerProps } from '~/components/drawers/FormDrawer'
import { MappingTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { NetsuiteIntegrationMapItemDrawerProps } from '../types'
import { useNetsuiteIntegrationMapItemDrawer } from '../useNetsuiteIntegrationMapItemDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

const mockCreateCollectionMapping = jest.fn()
const mockUpdateCollectionMapping = jest.fn()

jest.mock('../useNetsuiteIntegrationMappingCUD', () => ({
  useNetsuiteIntegrationMappingCUD: () => ({
    createCollectionMapping: mockCreateCollectionMapping,
    createMapping: jest.fn(),
    deleteCollectionMapping: jest.fn(),
    deleteMapping: jest.fn(),
    updateCollectionMapping: mockUpdateCollectionMapping,
    updateMapping: jest.fn(),
  }),
}))

const OPEN_BUTTON_TEST_ID = 'open-netsuite-map-item-drawer'
const INTEGRATION_ID = 'integration-1'

const DEFAULT_ENTITY = { id: null, key: 'default', name: 'Default' }

const TAX_DRAWER_PROPS: NetsuiteIntegrationMapItemDrawerProps = {
  type: MappingTypeEnum.Tax,
  integrationId: INTEGRATION_ID,
  billingEntities: [DEFAULT_ENTITY],
  itemMappings: {
    default: {
      itemId: null,
      itemExternalId: null,
      taxCode: null,
      taxNexus: null,
      taxType: null,
    },
  },
}

const COUPON_DRAWER_PROPS: NetsuiteIntegrationMapItemDrawerProps = {
  type: MappingTypeEnum.Coupon,
  integrationId: INTEGRATION_ID,
  billingEntities: [DEFAULT_ENTITY],
  itemMappings: {
    default: {
      itemId: 'coupon-mapping',
      itemExternalId: 'ext-id',
      itemExternalName: 'Ext name',
      itemExternalCode: 'ext-code',
    },
  },
}

type DrawerPayload = FormDrawerProps

const DrawerHost = ({ params }: { params: NetsuiteIntegrationMapItemDrawerProps }) => {
  const { openDrawer } = useNetsuiteIntegrationMapItemDrawer()

  return (
    <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(params)}>
      open
    </button>
  )
}

const getInput = (name: string): HTMLInputElement | null =>
  document.querySelector(`input[name="${name}"]`)

const openDrawerAndRenderBody = async (
  params: NetsuiteIntegrationMapItemDrawerProps,
): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<DrawerHost params={params} />)

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

describe('useNetsuiteIntegrationMapItemDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateCollectionMapping.mockResolvedValue({})
    mockUpdateCollectionMapping.mockResolvedValue({})
  })

  describe('GIVEN a tax mapping', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN should render only the tax fields', async () => {
        await openDrawerAndRenderBody(TAX_DRAWER_PROPS)

        expect(getInput('default.taxNexus')).toBeInTheDocument()
        expect(getInput('default.taxType')).toBeInTheDocument()
        expect(getInput('default.taxCode')).toBeInTheDocument()
        expect(getInput('default.externalId')).not.toBeInTheDocument()
      })
    })

    describe('WHEN only some tax fields are filled and the form is submitted', () => {
      it('THEN should block the submission', async () => {
        const { payload, user } = await openDrawerAndRenderBody(TAX_DRAWER_PROPS)

        await user.type(getInput('default.taxNexus') as HTMLInputElement, 'nexus')
        await submit(payload)

        expect(mockCreateCollectionMapping).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN every tax field is filled and the form is submitted', () => {
      it('THEN should create the tax mapping and close', async () => {
        const { payload, user } = await openDrawerAndRenderBody(TAX_DRAWER_PROPS)

        await user.type(getInput('default.taxNexus') as HTMLInputElement, 'nexus')
        await user.type(getInput('default.taxType') as HTMLInputElement, 'type')
        await user.type(getInput('default.taxCode') as HTMLInputElement, 'code')
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockCreateCollectionMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              integrationId: INTEGRATION_ID,
              mappingType: MappingTypeEnum.Tax,
              taxNexus: 'nexus',
              taxType: 'type',
              taxCode: 'code',
            }),
          },
        })
      })
    })
  })

  describe('GIVEN a non-tax mapping with an existing value', () => {
    describe('WHEN the drawer opens', () => {
      it('THEN should seed and render the external fields only', async () => {
        await openDrawerAndRenderBody(COUPON_DRAWER_PROPS)

        expect(getInput('default.externalName')).toHaveValue('Ext name')
        expect(getInput('default.externalId')).toHaveValue('ext-id')
        expect(getInput('default.externalAccountCode')).toHaveValue('ext-code')
        expect(getInput('default.taxCode')).not.toBeInTheDocument()
      })
    })

    describe('WHEN one external field is cleared and the form is submitted', () => {
      it('THEN should block the submission', async () => {
        const { payload, user } = await openDrawerAndRenderBody(COUPON_DRAWER_PROPS)

        await user.clear(getInput('default.externalAccountCode') as HTMLInputElement)
        await submit(payload)

        expect(mockUpdateCollectionMapping).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN an external field is changed and the form is submitted', () => {
      it('THEN should update the collection mapping', async () => {
        const { payload, user } = await openDrawerAndRenderBody(COUPON_DRAWER_PROPS)

        await user.type(getInput('default.externalAccountCode') as HTMLInputElement, '-2')
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockUpdateCollectionMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              id: 'coupon-mapping',
              mappingType: MappingTypeEnum.Coupon,
              externalAccountCode: 'ext-code-2',
            }),
          },
        })
      })
    })
  })
})
