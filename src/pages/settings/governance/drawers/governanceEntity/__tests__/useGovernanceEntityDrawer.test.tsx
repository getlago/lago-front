import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { ComponentProps, ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import {
  CreateGovernanceEntityDocument,
  CreateUsageAttributionTypeInput,
  GetGovernanceEntityParentOptionsDocument,
  UsageAttributionTypeRoleEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ATTRIBUTION_KEYS_ADD_BUTTON_TEST_ID,
  ATTRIBUTION_KEYS_CHIP_TEST_ID,
  ATTRIBUTION_KEYS_ERROR_TEST_ID,
} from '../AttributionKeysField'
import {
  GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID,
  GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID,
  GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID,
  GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID,
} from '../GovernanceEntityDrawerContent'
import { useGovernanceEntityDrawer } from '../useGovernanceEntityDrawer'
import { MAX_ATTRIBUTION_KEYS } from '../validationSchema'

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  secondaryAction?: ReactNode
  form?: { id: string; submit: () => void | Promise<void> }
  closeOnSubmitSuccess?: boolean
  shouldPromptOnClose?: () => boolean
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockOpen = jest.fn((args: CapturedDrawerArgs) => {
  lastDrawerArgs = args
})
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/form/ComboBox', () => {
  const actual = jest.requireActual<typeof import('~/components/form/ComboBox')>(
    '~/components/form/ComboBox',
  )

  return {
    ...actual,
    ComboBox: (props: ComponentProps<typeof actual.ComboBox>) => (
      <actual.ComboBox {...props} virtualized={false} />
    ),
  }
})

jest.mock('~/core/utils/domUtils', () => ({
  ...jest.requireActual('~/core/utils/domUtils'),
  scrollToAndClickElement: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const PARENT_ID = 'p1'

const parentOptionsMock: MockedResponse = {
  request: { query: GetGovernanceEntityParentOptionsDocument, variables: { limit: 100 } },
  result: {
    data: {
      usageAttributionTypes: {
        collection: [{ id: PARENT_ID, name: 'Engineering', code: 'engineering' }],
      },
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
}

const createdEntity = {
  id: 'entity-1',
  name: 'Department',
  code: 'department',
  role: UsageAttributionTypeRoleEnum.Hierarchical,
  createdAt: '2026-09-24T00:00:00Z',
  parent: null,
}

const createMock = (
  input: CreateUsageAttributionTypeInput,
  result: MockedResponse['result'] = { data: { createUsageAttributionType: createdEntity } },
): MockedResponse & { result: jest.Mock } => ({
  request: { query: CreateGovernanceEntityDocument, variables: { input } },
  result: jest.fn(() => result),
  maxUsageCount: Number.POSITIVE_INFINITY,
})

const valueAlreadyExistError = (field: string): GraphQLError =>
  new GraphQLError('Unprocessable Entity', {
    extensions: { code: 'unprocessable_entity', details: { [field]: ['value_already_exist'] } },
  })

const renderDrawer = (mocks: MockedResponse[] = []): void => {
  const { result } = renderHook(() => useGovernanceEntityDrawer(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    ),
  })

  act(() => result.current.openDrawer())
}

const renderDrawerBody = (): void => {
  if (!lastDrawerArgs?.children) throw new Error('Drawer was not opened')

  render(
    <MockedProvider mocks={[parentOptionsMock]} addTypename={false}>
      {lastDrawerArgs.children}
    </MockedProvider>,
  )
}

const inputIn = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

const selectOption = async (comboboxTestId: string, optionValue: string): Promise<void> => {
  const inputBase = screen
    .getByTestId(comboboxTestId)
    .querySelector('.MuiInputBase-root') as HTMLElement

  await userEvent.click(inputBase)

  const option = await waitFor(() => {
    const radio = document.querySelector(`input[type="radio"][value="${optionValue}"]`)

    expect(radio).toBeInTheDocument()

    return radio?.closest('.MuiAutocomplete-option') as HTMLElement
  })

  await userEvent.click(option)
}

const addKeys = async (keys: string[]): Promise<void> => {
  await userEvent.click(screen.getByTestId(ATTRIBUTION_KEYS_ADD_BUTTON_TEST_ID))

  for (const key of keys) {
    const keyInput = document.querySelector('input[name="attributionKeys"]') as HTMLInputElement

    await userEvent.type(keyInput, `${key}{enter}`)
  }
}

const fillEntity = async ({
  role,
  parent,
  keys,
}: {
  role: UsageAttributionTypeRoleEnum
  parent?: string
  keys: string[]
}): Promise<void> => {
  await userEvent.type(inputIn(GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID), 'Department')
  await waitFor(() =>
    expect(inputIn(GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID)).toHaveValue('department'),
  )
  await selectOption(GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID, role)

  if (parent) {
    await selectOption(GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID, parent)
  }

  await addKeys(keys)
}

const submit = async (): Promise<void> => {
  await act(async () => {
    await lastDrawerArgs?.form?.submit()
  })
}

const hierarchicalInput: CreateUsageAttributionTypeInput = {
  name: 'Department',
  code: 'department',
  role: UsageAttributionTypeRoleEnum.Hierarchical,
  parentId: PARENT_ID,
  attributionKeys: ['department_id'],
}

describe('useGovernanceEntityDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    lastDrawerArgs = null
  })

  describe('GIVEN the drawer is opened', () => {
    it('THEN should open a form drawer that decides itself when to close', () => {
      renderDrawer()

      expect(mockOpen).toHaveBeenCalledTimes(1)
      expect(lastDrawerArgs?.title).toEqual(expect.any(String))
      expect(lastDrawerArgs?.form?.id).toBe('governance-entity-drawer-form')
      expect(lastDrawerArgs?.closeOnSubmitSuccess).toBe(false)
      expect(lastDrawerArgs?.secondaryAction).toBeDefined()
      expect(lastDrawerArgs?.shouldPromptOnClose?.()).toBe(false)
    })
  })

  describe('GIVEN a hierarchical entity with a parent and a key', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should create it with the exact input, toast and close', async () => {
        const mutation = createMock(hierarchicalInput)

        renderDrawer([mutation])
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: ['department_id'],
        })
        await submit()

        await waitFor(() => expect(mockClose).toHaveBeenCalledTimes(1))
        expect(mutation.result).toHaveBeenCalledTimes(1)
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })

  describe('GIVEN a parent was picked before switching the type to flat', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should clear the parent, hide its field and send no parent', async () => {
        const mutation = createMock({
          name: 'Department',
          code: 'department',
          role: UsageAttributionTypeRoleEnum.Flat,
          attributionKeys: ['department_id'],
        })

        renderDrawer([mutation])
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: ['department_id'],
        })
        await selectOption(GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID, UsageAttributionTypeRoleEnum.Flat)

        expect(
          screen.queryByTestId(GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID),
        ).not.toBeInTheDocument()

        await selectOption(
          GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID,
          UsageAttributionTypeRoleEnum.Hierarchical,
        )

        expect(inputIn(GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID)).toHaveValue('')

        await selectOption(GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID, UsageAttributionTypeRoleEnum.Flat)

        await submit()

        await waitFor(() => expect(mutation.result).toHaveBeenCalledTimes(1))
      })
    })
  })

  describe('GIVEN the maximum number of keys', () => {
    describe('WHEN they are all added', () => {
      it('THEN should hide both the add action and the key input', async () => {
        renderDrawer()
        renderDrawerBody()

        await addKeys(Array.from({ length: MAX_ATTRIBUTION_KEYS }, (_, index) => `key_${index}`))

        expect(screen.queryByTestId(ATTRIBUTION_KEYS_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(document.querySelector('input[name="attributionKeys"]')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the key input was never revealed', () => {
    describe('WHEN the form is submitted without keys', () => {
      it('THEN should show the keys error without the input', async () => {
        renderDrawer()
        renderDrawerBody()

        await submit()

        expect(await screen.findByTestId(ATTRIBUTION_KEYS_ERROR_TEST_ID)).toBeInTheDocument()
        expect(document.querySelector('input[name="attributionKeys"]')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the backend rejects the code as already existing', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should keep the drawer open with the error on the code field', async () => {
        const mutation = createMock(hierarchicalInput, { errors: [valueAlreadyExistError('code')] })

        renderDrawer([mutation])
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: ['department_id'],
        })
        await submit()

        await waitFor(() => expect(mutation.result).toHaveBeenCalledTimes(1))
        expect(
          within(
            screen.getByTestId(GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID).parentElement as HTMLElement,
          ).queryByTestId('text-field-error'),
        ).toBeInTheDocument()
        expect(mockClose).not.toHaveBeenCalled()
        expect(addToast).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the backend rejects a key already used by another entity', () => {
    describe('WHEN the maximum number of keys is submitted', () => {
      it('THEN should show the error under the chips and allow a new submit after an edit', async () => {
        const fourKeys = Array.from({ length: MAX_ATTRIBUTION_KEYS }, (_, index) => `key_${index}`)
        const takenMutation = createMock(
          { ...hierarchicalInput, attributionKeys: fourKeys },
          { errors: [valueAlreadyExistError('attributionKeys')] },
        )
        const retryMutation = createMock({
          ...hierarchicalInput,
          attributionKeys: fourKeys.slice(1),
        })

        renderDrawer([takenMutation, retryMutation])
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: fourKeys,
        })
        await submit()

        expect(await screen.findByTestId(ATTRIBUTION_KEYS_ERROR_TEST_ID)).toBeInTheDocument()
        expect(mockClose).not.toHaveBeenCalled()

        const [firstChip] = screen.getAllByTestId(ATTRIBUTION_KEYS_CHIP_TEST_ID)

        await userEvent.click(within(firstChip).getByRole('button'))
        await submit()

        await waitFor(() => expect(retryMutation.result).toHaveBeenCalledTimes(1))
      })
    })
  })

  describe('GIVEN the backend fails with an unmapped error', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should show a danger toast and keep the drawer open', async () => {
        const mutation = createMock(hierarchicalInput, {
          errors: [
            new GraphQLError('Unprocessable Entity', {
              extensions: {
                code: 'unprocessable_entity',
                details: { parentId: ['cannot_form_a_cycle'] },
              },
            }),
          ],
        })

        renderDrawer([mutation])
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: ['department_id'],
        })
        await submit()

        await waitFor(() =>
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' })),
        )
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN create more is enabled', () => {
    describe('WHEN an entity is created', () => {
      it('THEN should keep the drawer open and reset the form', async () => {
        const mutation = createMock(hierarchicalInput)

        renderDrawer([mutation])
        render(<>{lastDrawerArgs?.secondaryAction}</>)
        await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))
        renderDrawerBody()

        await fillEntity({
          role: UsageAttributionTypeRoleEnum.Hierarchical,
          parent: PARENT_ID,
          keys: ['department_id'],
        })
        await submit()

        await waitFor(() => expect(mutation.result).toHaveBeenCalledTimes(1))
        await waitFor(() => expect(inputIn(GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID)).toHaveValue(''))
        expect(mockClose).not.toHaveBeenCalled()
        expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
      })
    })
  })
})
