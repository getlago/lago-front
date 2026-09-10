import { revalidateLogic } from '@tanstack/react-form'
import { act, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'

import type { LocalPrivilegeInput } from '~/components/plans/types'
import { PrivilegeValueTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { DEFAULT_VALUES } from '../constants'
import { FeatureEntitlementDrawerContent } from '../FeatureEntitlementDrawerContent'

// jsdom has no layout measurements for the real combobox's virtualized options.
jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, index) => ({
        index,
        key: index,
        start: index * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

// Local privilege options do not need the search hook's loading timer.
jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({ debouncedSearch: jest.fn(), isLoading: false }),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery: () => ({
    data: null,
    loading: false,
  }),
  useGetFeaturesListForPlanSectionLazyQuery: () => [jest.fn(), { data: null }],
}))

const buildPrivilege = (overrides: Partial<LocalPrivilegeInput> = {}): LocalPrivilegeInput => ({
  privilegeCode: 'first',
  privilegeName: 'First privilege',
  value: 'original string',
  valueType: PrivilegeValueTypeEnum.String,
  ...overrides,
})

const renderContent = (
  privileges: LocalPrivilegeInput[],
): ReturnType<typeof render> & {
  form: ComponentProps<typeof FeatureEntitlementDrawerContent>['form']
  onSubmit: jest.Mock
} => {
  const onSubmit = jest.fn()
  const { result } = renderHook(() =>
    useAppForm({
      defaultValues: {
        ...DEFAULT_VALUES,
        featureId: 'feature-1',
        featureCode: 'feature',
        privileges,
      },
      validationLogic: revalidateLogic(),
      onSubmit: ({ value }) => onSubmit(value),
    }),
  )
  const rendered = render(
    <FeatureEntitlementDrawerContent form={result.current} existingFeatureCodes={[]} />,
  )

  return { ...rendered, form: result.current, onSubmit }
}

const getPrivilegeRow = (name: string): HTMLElement => {
  const row = screen.getByText(name).closest('tr')

  if (!row) throw new Error(`Missing privilege row: ${name}`)

  return row
}

describe('PrivilegesTable', () => {
  it('hides the table when there are no privileges', () => {
    renderContent([])

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it.each([
    {
      valueType: PrivilegeValueTypeEnum.String,
      input: 'updated string',
      expected: 'updated string',
    },
    { valueType: PrivilegeValueTypeEnum.Integer, input: '-12.5abc', expected: '125' },
  ])(
    'edits only the second $valueType row and submits its formatted value',
    async ({ valueType, input, expected }) => {
      const user = userEvent.setup()
      const { form, onSubmit } = renderContent([
        buildPrivilege(),
        buildPrivilege({
          privilegeCode: 'second',
          privilegeName: 'Second privilege',
          valueType,
          value: '',
        }),
      ])

      await user.type(within(getPrivilegeRow('Second privilege')).getByRole('textbox'), input)
      await act(async () => form.handleSubmit())

      expect(form.state.values.privileges.map(({ value }) => value)).toEqual([
        'original string',
        expected,
      ])
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ privileges: form.state.values.privileges }),
      )
    },
  )

  it.each([
    {
      valueType: PrivilegeValueTypeEnum.Boolean,
      option: 'False',
      expected: 'false',
      config: undefined,
    },
    {
      valueType: PrivilegeValueTypeEnum.Select,
      option: 'Premium',
      expected: 'Premium',
      config: { selectOptions: ['Basic', 'Premium'] },
    },
  ])(
    'selects and submits a new value only for the second $valueType row',
    async ({ valueType, option, expected, config }) => {
      const user = userEvent.setup()
      const { form, onSubmit } = renderContent([
        buildPrivilege(),
        buildPrivilege({
          privilegeCode: 'second',
          privilegeName: 'Second privilege',
          valueType,
          value: '',
          config,
        }),
      ])

      await user.click(within(getPrivilegeRow('Second privilege')).getByRole('combobox'))
      await user.click(screen.getByRole('option', { name: new RegExp(option) }))
      await act(async () => form.handleSubmit())

      expect(form.state.values.privileges.map(({ value }) => value)).toEqual([
        'original string',
        expected,
      ])
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ privileges: form.state.values.privileges }),
      )
    },
  )

  it.each([0, 1])('deletes row %s and keeps the remaining row editable', async (index) => {
    const user = userEvent.setup()
    const privileges = [
      buildPrivilege(),
      buildPrivilege({
        privilegeCode: 'second',
        privilegeName: 'Second privilege',
        value: 'second value',
      }),
    ]
    const { form } = renderContent(privileges)

    await user.click(
      within(
        getPrivilegeRow(privileges[index].privilegeName || privileges[index].privilegeCode),
      ).getByRole('button', {
        hidden: true,
      }),
    )

    const remaining = privileges[1 - index]

    expect(form.state.values.privileges).toEqual([remaining])
    const input = within(
      getPrivilegeRow(remaining.privilegeName || remaining.privilegeCode),
    ).getByRole('textbox')

    await user.clear(input)
    await user.type(input, 'edited after deletion')
    expect(form.state.values.privileges[0].value).toBe('edited after deletion')
  })

  it.each(Object.values(PrivilegeValueTypeEnum))(
    'shows validation errors on the correct %s field',
    async (valueType) => {
      const user = userEvent.setup()
      const { form } = renderContent([
        buildPrivilege(),
        buildPrivilege({
          privilegeCode: 'second',
          privilegeName: 'Second privilege',
          valueType,
          value: '',
        }),
      ])
      const row = getPrivilegeRow('Second privilege')
      const role = [PrivilegeValueTypeEnum.Select, PrivilegeValueTypeEnum.Boolean].includes(
        valueType,
      )
        ? 'combobox'
        : 'textbox'
      const input = within(row).getByRole(role)

      expect(input).toHaveAttribute('aria-invalid', 'false')
      act(() => {
        form.setFieldMeta('privileges[1].value', (meta) => ({
          ...meta,
          errorMap: { onChange: { message: 'text_1771342994699klxu2paz7g8' } },
        }))
      })

      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(within(getPrivilegeRow('First privilege')).getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'false',
      )
      await user.hover(input)
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Field is required')
    },
  )

  it('renders a select value when options are missing', async () => {
    const user = userEvent.setup()

    renderContent([buildPrivilege({ valueType: PrivilegeValueTypeEnum.Select, value: '' })])

    await user.click(screen.getByRole('combobox'))

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
