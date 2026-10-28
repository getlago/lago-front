import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form'
import { MappableTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { stringifyOptionValue } from '../stringifyOptionValue'
import { xeroMappingDefaultValues } from '../validationSchema'
import { XeroIntegrationMapItemDrawerContent } from '../XeroIntegrationMapItemDrawerContent'

const SEEDED_ITEM = { externalId: 'ext-1', externalName: 'Sales', externalAccountCode: '200' }

const mockComboboxData = [
  {
    label: 'Sales (200)',
    description: SEEDED_ITEM.externalId,
    value: stringifyOptionValue(SEEDED_ITEM),
  },
]

const mockItemsHookMounted = jest.fn()
const mockRefresh = jest.fn()
const mockSearchQuery = jest.fn()

jest.mock('../useXeroIntegrationItems', () => ({
  useXeroIntegrationItems: (formType: unknown, integrationId: unknown) => {
    // The mount effect runs once per component instance holding the hook: it is what the
    // assertions below count to prove the query is not re-instantiated per rendered tab.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, react-hooks/rules-of-hooks
    require('react').useEffect(() => {
      mockItemsHookMounted(formType, integrationId)
    }, [formType, integrationId])

    return {
      comboboxData: mockComboboxData,
      isLoading: false,
      searchQuery: mockSearchQuery as unknown as ComboBoxProps['searchQuery'],
      refresh: mockRefresh,
    }
  },
}))

const INTEGRATION_ID = 'integration-1'
const FORM_ID = 'xero-map-item-form'

const BILLING_ENTITIES = [
  { id: null, key: 'default', name: 'Default' },
  { id: 'be-1', key: 'acme', name: 'Acme' },
  { id: 'be-2', key: 'globex', name: 'Globex' },
]

const TestHost = () => {
  const form = useAppForm({ defaultValues: xeroMappingDefaultValues })

  return (
    <XeroIntegrationMapItemDrawerContent
      title="Map item"
      description="Pick a Xero item"
      billingEntities={BILLING_ENTITIES}
      form={form}
      formId={FORM_ID}
      formType={MappableTypeEnum.AddOn}
      integrationId={INTEGRATION_ID}
    />
  )
}

describe('XeroIntegrationMapItemDrawerContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a drawer with several billing entity tabs', () => {
    describe('WHEN it first renders', () => {
      it('THEN should instantiate the items query once for the whole drawer', () => {
        render(<TestHost />)

        expect(mockItemsHookMounted).toHaveBeenCalledTimes(1)
        expect(mockItemsHookMounted).toHaveBeenCalledWith(MappableTypeEnum.AddOn, INTEGRATION_ID)
      })

      it('THEN should give the hoisted options to every rendered combobox', () => {
        render(<TestHost />)

        const comboboxes = document.querySelectorAll('input[name$=".selectedElementValue"]')

        expect(comboboxes).toHaveLength(2)
      })
    })

    describe('WHEN switching billing entity tabs', () => {
      it('THEN should not re-instantiate the items query', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<TestHost />)

        await user.click(screen.getByRole('tab', { name: 'Globex' }))
        await user.click(screen.getByRole('tab', { name: 'Acme' }))

        expect(mockItemsHookMounted).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the refresh button of a tab is clicked', () => {
      it('THEN should call the hoisted refresh', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<TestHost />)

        const refreshButtons = screen.getAllByTestId('button')

        await user.click(refreshButtons[refreshButtons.length - 1])

        expect(mockRefresh).toHaveBeenCalledTimes(1)
      })
    })
  })
})
