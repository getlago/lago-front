import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ComboBoxProps } from '~/components/form'
import { MappableTypeEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { stringifyOptionValue } from '../stringifyOptionValue'
import { xeroMappingDefaultValues } from '../validationSchema'
import { XeroIntegrationMapItemDrawerContent } from '../XeroIntegrationMapItemDrawerContent'

const SEEDED_ITEM = { externalId: 'ext-1', externalName: 'Sales', externalAccountCode: '200' }
const OTHER_ITEM = { externalId: 'ext-2', externalName: 'Services', externalAccountCode: '300' }

const toOption = (item: typeof SEEDED_ITEM) => ({
  label: `${item.externalName} (${item.externalAccountCode})`,
  description: item.externalId,
  value: stringifyOptionValue(item),
})

const mockComboboxData = [toOption(SEEDED_ITEM), toOption(OTHER_ITEM)]
// What the shared query holds once one combobox has searched: the other mapping's item is gone.
const mockSearchedComboboxData = [toOption(SEEDED_ITEM)]
const mockSetIsSearching = { current: jest.fn<void, [boolean]>() }

const mockItemsHookMounted = jest.fn()
const mockRefresh = jest.fn()
const mockSearchQuery = jest.fn()

jest.mock('../useXeroIntegrationItems', () => ({
  useXeroIntegrationItems: (formType: unknown, integrationId: unknown) => {
    // The mount effect runs once per component instance holding the hook: it is what the
    // assertions below count to prove the query is not re-instantiated per rendered tab.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(() => {
      mockItemsHookMounted(formType, integrationId)
    }, [formType, integrationId])

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const [isSearching, setIsSearching] = require('react').useState(false)

    mockSetIsSearching.current = setIsSearching

    return {
      comboboxData: isSearching ? mockSearchedComboboxData : mockComboboxData,
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

const TestHost = ({ seeded = false }: { seeded?: boolean }) => {
  const form = useAppForm({
    defaultValues: seeded
      ? {
          default: { selectedElementValue: stringifyOptionValue(SEEDED_ITEM) },
          acme: { selectedElementValue: stringifyOptionValue(OTHER_ITEM) },
        }
      : xeroMappingDefaultValues,
  })

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

    describe('WHEN one combobox narrows the shared list by searching', () => {
      // Regression: the shared list used to drop the other mapping's item, and ComboBox clears a
      // field whose selected option leaves `data` — silently wiping an untouched mapping.
      it('THEN should keep the mapping selected in the other combobox', () => {
        render(<TestHost seeded />)

        const acmeInput = document.querySelector(
          'input[name="acme.selectedElementValue"]',
        ) as HTMLInputElement

        expect(acmeInput).toHaveValue('Services (300)')

        act(() => {
          mockSetIsSearching.current(true)
        })

        expect(document.querySelector('input[name="acme.selectedElementValue"]')).toHaveValue(
          'Services (300)',
        )
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
