import { act, screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'

import { FormDrawerProps } from '~/components/drawers/FormDrawer'
import { MappableTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { AnrokIntegrationMapItemDrawerProps } from '../types'
import { useAnrokIntegrationMapItemDrawer } from '../useAnrokIntegrationMapItemDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()
const mockAddToast = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: (args: unknown) => mockAddToast(args),
}))

const mockCreateMapping = jest.fn()
const mockUpdateMapping = jest.fn()
const mockDeleteMapping = jest.fn()
const mockCUDTypes = jest.fn()

jest.mock('../useAnrokIntegrationMappingCUD', () => ({
  useAnrokIntegrationMappingCUD: (type: unknown) => {
    mockCUDTypes(type)

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

const OPEN_BUTTON_TEST_ID = 'open-anrok-map-item-drawer'
const INTEGRATION_ID = 'integration-1'
const DEFAULT_MAPPING_ID = 'mapping-default'

const DRAWER_PROPS: AnrokIntegrationMapItemDrawerProps = {
  type: MappableTypeEnum.BillableMetric,
  integrationId: INTEGRATION_ID,
  billingEntities: [
    { id: null, key: 'default', name: 'Default' },
    { id: 'be-1', key: 'be-1', name: 'Entity One' },
  ],
  itemMappings: {
    default: {
      itemId: DEFAULT_MAPPING_ID,
      itemExternalId: 'ext-id',
      itemExternalName: 'Ext name',
      lagoMappableId: 'bm-1',
      lagoMappableName: 'Metric',
    },
    'be-1': {
      itemId: null,
      itemExternalId: null,
      lagoMappableId: 'bm-1',
      lagoMappableName: 'Metric',
    },
  },
}

const MULTI_ENTITY_DRAWER_PROPS: AnrokIntegrationMapItemDrawerProps = {
  ...DRAWER_PROPS,
  billingEntities: [
    ...DRAWER_PROPS.billingEntities,
    { id: 'be-2', key: 'be-2', name: 'Entity Two' },
  ],
  itemMappings: {
    ...DRAWER_PROPS.itemMappings,
    'be-2': {
      itemId: null,
      itemExternalId: null,
      lagoMappableId: 'bm-1',
      lagoMappableName: 'Metric',
    },
  },
}

const SAVE_BUTTON_TEST_ID = 'anrok-integration-map-item-drawer-save'

const mockScrollIntoView = jest.fn()

Element.prototype.scrollIntoView = mockScrollIntoView

type DrawerPayload = FormDrawerProps

const DrawerHost = ({ params }: { params: AnrokIntegrationMapItemDrawerProps }) => {
  const { openDrawer } = useAnrokIntegrationMapItemDrawer()

  return (
    <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(params)}>
      open
    </button>
  )
}

const lastDrawerPayload = (): DrawerPayload => mockOpen.mock.calls.at(-1)?.[0] as DrawerPayload

const getInput = (name: string): HTMLInputElement =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement

const openDrawerAndRenderBody = async (
  params: AnrokIntegrationMapItemDrawerProps = DRAWER_PROPS,
): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<DrawerHost params={params} />)

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  const payload = lastDrawerPayload()

  render(
    <form
      id={payload.form.id}
      onSubmit={(event) => {
        event.preventDefault()
        payload.form.submit()
      }}
    >
      {payload.children}
      {payload.mainAction}
    </form>,
  )

  return { payload, user }
}

const submit = async (payload: DrawerPayload): Promise<void> => {
  await act(async () => {
    await payload.form.submit()
  })
}

describe('useAnrokIntegrationMapItemDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateMapping.mockResolvedValue({})
    mockUpdateMapping.mockResolvedValue({})
    mockDeleteMapping.mockResolvedValue({})
  })

  describe('GIVEN the drawer is opened', () => {
    describe('WHEN it opens', () => {
      it('THEN should open a form drawer that owns its own closing', async () => {
        const { payload } = await openDrawerAndRenderBody()

        expect(mockOpen).toHaveBeenCalledTimes(1)
        expect(payload.closeOnSubmitSuccess).toBe(false)
        expect(payload.cancelOrCloseText).toBe('cancel')
        expect(payload.form.id).toBe('anrok-integration-map-item-drawer-form')
        expect(payload.title).toEqual(expect.any(String))
      })

      it('THEN should seed each billing entity with its existing mapping', async () => {
        await openDrawerAndRenderBody()

        expect(getInput('default.externalId')).toHaveValue('ext-id')
        expect(getInput('default.externalName')).toHaveValue('Ext name')
        expect(getInput('be-1.externalId')).toHaveValue('')
        expect(getInput('be-1.externalName')).toHaveValue('')
      })

      it('THEN should scope the mutation hooks to the opened mapping type', async () => {
        await openDrawerAndRenderBody()

        expect(mockCUDTypes).toHaveBeenLastCalledWith(MappableTypeEnum.BillableMetric)
      })
    })

    describe('WHEN the form is pristine', () => {
      it('THEN should not prompt on close', async () => {
        const { payload } = await openDrawerAndRenderBody()

        expect(payload.shouldPromptOnClose?.()).toBe(false)
      })
    })

    describe('WHEN a field is edited', () => {
      it('THEN should prompt on close', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.type(getInput('be-1.externalId'), 'x')

        expect(payload.shouldPromptOnClose?.()).toBe(true)
      })
    })
  })

  describe('GIVEN a billing entity without mapping', () => {
    describe('WHEN both fields are filled and the form is submitted', () => {
      it('THEN should create the mapping, toast and close the drawer', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.type(getInput('be-1.externalId'), 'new-id')
        await user.type(getInput('be-1.externalName'), 'New name')
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockCreateMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              integrationId: INTEGRATION_ID,
              mappableType: MappableTypeEnum.BillableMetric,
              mappableId: 'bm-1',
              billingEntityId: 'be-1',
              externalId: 'new-id',
              externalName: 'New name',
            }),
          },
        })
        expect(mockUpdateMapping).not.toHaveBeenCalled()
        expect(mockDeleteMapping).not.toHaveBeenCalled()
        expect(mockAddToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })

    describe('WHEN only one field is filled and the form is submitted', () => {
      it('THEN should block the submission and keep the drawer open', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.type(getInput('be-1.externalId'), 'new-id')
        await submit(payload)

        expect(mockCreateMapping).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a billing entity with an existing mapping', () => {
    describe('WHEN a field is changed and the form is submitted', () => {
      it('THEN should update the mapping', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.clear(getInput('default.externalName'))
        await user.type(getInput('default.externalName'), 'Renamed')
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockUpdateMapping).toHaveBeenCalledWith({
          variables: {
            input: expect.objectContaining({
              id: DEFAULT_MAPPING_ID,
              externalId: 'ext-id',
              externalName: 'Renamed',
            }),
          },
        })
      })
    })

    describe('WHEN every field is cleared and the form is submitted', () => {
      it('THEN should delete the mapping', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.clear(getInput('default.externalId'))
        await user.clear(getInput('default.externalName'))
        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockDeleteMapping).toHaveBeenCalledWith({
          variables: { input: { id: DEFAULT_MAPPING_ID } },
        })
      })
    })

    describe('WHEN nothing changed and the form is submitted', () => {
      it('THEN should close without any mutation', async () => {
        const { payload } = await openDrawerAndRenderBody()

        await submit(payload)

        await waitFor(() => expect(mockClose).toHaveBeenCalled())
        expect(mockCreateMapping).not.toHaveBeenCalled()
        expect(mockUpdateMapping).not.toHaveBeenCalled()
        expect(mockDeleteMapping).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the mutation returns errors', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should keep the drawer open without a success toast', async () => {
        mockUpdateMapping.mockResolvedValue({ errors: [{ message: 'failure' }] })
        const { payload, user } = await openDrawerAndRenderBody()

        await user.type(getInput('default.externalName'), '!')
        await submit(payload)

        await waitFor(() => expect(mockUpdateMapping).toHaveBeenCalled())
        expect(mockClose).not.toHaveBeenCalled()
        expect(mockAddToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer is closed', () => {
    describe('WHEN onClose runs after an edit', () => {
      it('THEN should reset the form', async () => {
        const { payload, user } = await openDrawerAndRenderBody()

        await user.type(getInput('be-1.externalId'), 'x')

        act(() => payload.onClose?.())

        expect(payload.shouldPromptOnClose?.()).toBe(false)
      })
    })
  })

  describe('GIVEN several billing entity tabs', () => {
    describe('WHEN a partially filled tab is left and reopened after an invalid submit', () => {
      it('THEN should keep the error visible and re-enable save once fixed', async () => {
        const { user } = await openDrawerAndRenderBody(MULTI_ENTITY_DRAWER_PROPS)

        await user.type(getInput('be-1.externalId'), 'partial')
        await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(getInput('be-1.externalName')).toHaveAttribute('aria-invalid', 'true'),
        )

        await user.click(screen.getByRole('tab', { name: 'Entity Two' }))
        await user.click(screen.getByRole('tab', { name: 'Entity One' }))

        expect(getInput('be-1.externalId')).toHaveValue('partial')
        await waitFor(() =>
          expect(getInput('be-1.externalName')).toHaveAttribute('aria-invalid', 'true'),
        )
        expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toBeDisabled()

        await user.type(getInput('be-1.externalName'), 'Name')

        await waitFor(() => expect(screen.getByTestId(SAVE_BUTTON_TEST_ID)).toBeEnabled())
      })
    })

    describe('WHEN the only invalid entry sits on a tab that is not selected and save is clicked', () => {
      it('THEN should select that tab, show its error and scroll to the field', async () => {
        const { user } = await openDrawerAndRenderBody(MULTI_ENTITY_DRAWER_PROPS)

        await user.click(screen.getByRole('tab', { name: 'Entity Two' }))
        await user.type(getInput('be-2.externalId'), 'partial')
        await user.click(screen.getByRole('tab', { name: 'Entity One' }))
        await user.click(screen.getByTestId(SAVE_BUTTON_TEST_ID))

        await waitFor(() =>
          expect(screen.getByRole('tab', { name: 'Entity Two' })).toHaveAttribute(
            'aria-selected',
            'true',
          ),
        )
        await waitFor(() =>
          expect(getInput('be-2.externalName')).toHaveAttribute('aria-invalid', 'true'),
        )
        expect(mockScrollIntoView).toHaveBeenCalled()
        expect(mockCreateMapping).not.toHaveBeenCalled()
      })
    })
  })
})
