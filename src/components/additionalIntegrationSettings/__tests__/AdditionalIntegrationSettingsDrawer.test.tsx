import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import {
  CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID,
  CONNECTION_FIELDS_SKIP_RADIO_TEST_ID,
  CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID,
} from '~/components/connectionSelection/ConnectionBehaviorFields'
import { ConnectionBehavior } from '~/components/connectionSelection/types'
import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { ConnectionBehaviorEnum, IntegrationTypeEnum } from '~/generated/graphql'
import { CustomerIntegrationConnection } from '~/hooks/customer/useCustomerIntegrationConnections'
import { render } from '~/test-utils'

import { ADDITIONAL_INTEGRATION_CATEGORIES } from '../additionalIntegrationSettingsSchema'
import {
  ADDITIONAL_INTEGRATION_TAX_DISCLAIMER_TEST_ID,
  getAdditionalIntegrationDefaultChipTestId,
  getAdditionalIntegrationNoDefaultChipTestId,
  getAdditionalIntegrationSectionTestId,
} from '../AdditionalIntegrationSettingsSection'
import {
  ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID,
  ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR,
  AdditionalIntegrationSettingsSelector,
} from '../AdditionalIntegrationSettingsSelector'

const mockOpen = jest.fn()
const mockClose = jest.fn()

const NETSUITE_CONNECTION: CustomerIntegrationConnection = {
  id: 'ic-1',
  code: 'customer_netsuite',
  name: 'Netsuite EU',
  group: 'Netsuite',
  integrationType: IntegrationTypeEnum.Netsuite,
  isDefault: true,
}

const HUBSPOT_CONNECTION: CustomerIntegrationConnection = {
  id: 'ic-2',
  code: 'customer_hubspot',
  name: 'Hubspot Main',
  group: 'Hubspot',
  integrationType: IntegrationTypeEnum.Hubspot,
  isDefault: true,
}

const ANROK_CONNECTION: CustomerIntegrationConnection = {
  id: 'ic-3',
  code: 'customer_anrok',
  name: 'Anrok EU',
  group: 'Anrok',
  integrationType: IntegrationTypeEnum.Anrok,
  isDefault: true,
}

const CONNECTION_BY_CATEGORY: Record<IntegrationConnectionCategory, CustomerIntegrationConnection> =
  {
    [ConnectionCategory.Accounting]: NETSUITE_CONNECTION,
    [ConnectionCategory.Crm]: HUBSPOT_CONNECTION,
    [ConnectionCategory.Tax]: ANROK_CONNECTION,
  }

const mockConnectionsByCategory = {
  current: {} as Partial<Record<IntegrationConnectionCategory, CustomerIntegrationConnection[]>>,
}

const mockConnectionsLoading = { current: false }

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

jest.mock('~/hooks/customer/useCustomerIntegrationConnections', () => ({
  useCustomerIntegrationConnections: ({
    category,
  }: {
    category: IntegrationConnectionCategory
  }) => {
    const connections = mockConnectionsByCategory.current[category] || []

    return {
      connections,
      options: connections.map((connection) => ({
        value: connection.code,
        label: connection.name,
        subLabel: connection.code,
        group: connection.group,
        isDefault: connection.isDefault,
      })),
      defaultConnection: connections.find((connection) => connection.isDefault),
      loading: mockConnectionsLoading.current,
    }
  },
}))

type OpenedDrawer = {
  form: { submit: () => Promise<void> }
  children: ReactNode
}

const openDrawerFromSelector = async (
  props: Partial<React.ComponentProps<typeof AdditionalIntegrationSettingsSelector>> = {},
) => {
  const user = userEvent.setup()
  const onChange = jest.fn()

  render(
    <AdditionalIntegrationSettingsSelector
      customerId="customer-1"
      values={{
        [ConnectionCategory.Accounting]: undefined,
        [ConnectionCategory.Crm]: undefined,
        [ConnectionCategory.Tax]: undefined,
      }}
      onChange={onChange}
      {...props}
    />,
  )

  await user.click(screen.getByTestId(ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID))

  const opened = mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawer

  return { user, onChange, opened }
}

const sectionOf = (category: IntegrationConnectionCategory) =>
  screen.getByTestId(getAdditionalIntegrationSectionTestId(category))

const radioIn = (category: IntegrationConnectionCategory, testId: string) =>
  within(sectionOf(category)).getByTestId(testId).querySelector('input') as HTMLInputElement

const comboBoxIn = (category: IntegrationConnectionCategory) =>
  sectionOf(category).querySelector(`input[name="selectConnection-${category}"]`)

describe('AdditionalIntegrationSettingsSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockConnectionsLoading.current = false
    mockConnectionsByCategory.current = {
      [ConnectionCategory.Accounting]: [NETSUITE_CONNECTION],
      [ConnectionCategory.Crm]: [HUBSPOT_CONNECTION],
      [ConnectionCategory.Tax]: [ANROK_CONNECTION],
    }
  })

  describe('GIVEN the details view asks for the drawer to open on landing', () => {
    const EMPTY_VALUES = {
      [ConnectionCategory.Accounting]: undefined,
      [ConnectionCategory.Crm]: undefined,
      [ConnectionCategory.Tax]: undefined,
    }

    describe('WHEN the selector mounts with autoOpen', () => {
      it('THEN should open the drawer once', () => {
        const { rerender } = render(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={EMPTY_VALUES}
            onChange={jest.fn()}
            autoOpen
          />,
        )

        expect(mockOpen).toHaveBeenCalledTimes(1)

        rerender(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={EMPTY_VALUES}
            onChange={jest.fn()}
            autoOpen
          />,
        )

        expect(mockOpen).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the selector is mounted', () => {
    describe('WHEN it renders', () => {
      it('THEN should display the entry card without opening the drawer', () => {
        render(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={{
              [ConnectionCategory.Accounting]: undefined,
              [ConnectionCategory.Crm]: undefined,
              [ConnectionCategory.Tax]: undefined,
            }}
            onChange={jest.fn()}
          />,
        )

        expect(
          screen.getByTestId(ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID),
        ).toBeInTheDocument()
        expect(mockOpen).not.toHaveBeenCalled()
      })
    })

    describe('WHEN a data-test override is provided', () => {
      it('THEN should tag the card with it', () => {
        render(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={{
              [ConnectionCategory.Accounting]: undefined,
              [ConnectionCategory.Crm]: undefined,
              [ConnectionCategory.Tax]: undefined,
            }}
            onChange={jest.fn()}
            data-test="rule-additional-integration-settings-selector"
          />,
        )

        expect(
          screen.getByTestId('rule-additional-integration-settings-selector'),
        ).toBeInTheDocument()
      })
    })

    describe('WHEN the card is clicked', () => {
      it('THEN should open the drawer seeded with the current values', async () => {
        const seededValues = {
          [ConnectionCategory.Accounting]: { code: 'customer_netsuite' },
          [ConnectionCategory.Crm]: { behavior: ConnectionBehaviorEnum.Skip },
          [ConnectionCategory.Tax]: undefined,
        }

        const { onChange, opened } = await openDrawerFromSelector({ values: seededValues })

        expect(mockOpen).toHaveBeenCalledTimes(1)

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith(seededValues)
        expect(mockClose).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a stored choice per category', () => {
    describe('WHEN summarising it on the card', () => {
      it('THEN should join one segment per touched category', async () => {
        render(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={{
              [ConnectionCategory.Accounting]: { code: 'customer_netsuite' },
              [ConnectionCategory.Crm]: { behavior: ConnectionBehaviorEnum.Skip },
              [ConnectionCategory.Tax]: undefined,
            }}
            onChange={jest.fn()}
          />,
        )

        const card = screen.getByTestId(ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID)

        expect(card).toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.SPECIFIC],
        )
        expect(card).toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.SKIP],
        )
        expect(card).not.toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.INHERIT],
        )
      })

      it('THEN should fall back to the customer default segment when nothing was touched', async () => {
        render(
          <AdditionalIntegrationSettingsSelector
            customerId="customer-1"
            values={{
              [ConnectionCategory.Accounting]: undefined,
              [ConnectionCategory.Crm]: undefined,
              [ConnectionCategory.Tax]: undefined,
            }}
            onChange={jest.fn()}
          />,
        )

        const card = screen.getByTestId(ADDITIONAL_INTEGRATION_SETTINGS_SELECTOR_TEST_ID)

        expect(card).toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.INHERIT],
        )
        expect(card).not.toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.SPECIFIC],
        )
        expect(card).not.toHaveTextContent(
          ADDITIONAL_INTEGRATION_SUMMARY_KEY_BY_BEHAVIOR[ConnectionBehavior.SKIP],
        )
      })
    })
  })

  describe('GIVEN the drawer is open', () => {
    describe('WHEN the content mounts', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should render the %s section',
        async (category) => {
          const { opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          expect(sectionOf(category)).toBeInTheDocument()
        },
      )

      it('THEN should render the three sections in the accounting, CRM, tax order', async () => {
        const { opened } = await openDrawerFromSelector()

        const { container } = render(<>{opened.children}</>)

        const rendered = Array.from(
          container.querySelectorAll('[data-test^="additional-integration-section-"]'),
        ).map((node) => node.getAttribute('data-test'))

        expect(rendered).toEqual(
          ADDITIONAL_INTEGRATION_CATEGORIES.map(getAdditionalIntegrationSectionTestId),
        )
      })
    })

    describe('WHEN every category is left on the inherit branch', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should hide the %s connection combobox',
        async (category) => {
          const { opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          expect(comboBoxIn(category)).toBeNull()
        },
      )
    })

    describe('WHEN a category is switched to the specific branch', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should reveal the combobox on the %s section only',
        async (category) => {
          const { user, opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          await user.click(radioIn(category, CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))

          expect(comboBoxIn(category)).toBeInTheDocument()

          ADDITIONAL_INTEGRATION_CATEGORIES.filter((other) => other !== category).forEach(
            (other) => {
              expect(comboBoxIn(other)).toBeNull()
            },
          )
        },
      )

      it('THEN should hide it again on the skip branch', async () => {
        const { user, opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        await user.click(
          radioIn(ConnectionCategory.Accounting, CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID),
        )
        await user.click(
          radioIn(ConnectionCategory.Accounting, CONNECTION_FIELDS_SKIP_RADIO_TEST_ID),
        )

        expect(comboBoxIn(ConnectionCategory.Accounting)).toBeNull()
      })
    })

    describe('WHEN one category is skipped and saved', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should publish only the %s choice',
        async (category) => {
          const { user, onChange, opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          await user.click(radioIn(category, CONNECTION_FIELDS_SKIP_RADIO_TEST_ID))

          await act(async () => {
            await opened.form.submit()
          })

          expect(onChange).toHaveBeenCalledWith({
            [ConnectionCategory.Accounting]: undefined,
            [ConnectionCategory.Crm]: undefined,
            [ConnectionCategory.Tax]: undefined,
            [category]: { behavior: ConnectionBehaviorEnum.Skip },
          })
        },
      )
    })

    describe('WHEN two categories are changed before saving', () => {
      it('THEN should publish both without touching the third', async () => {
        const { user, onChange, opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        await user.click(radioIn(ConnectionCategory.Crm, CONNECTION_FIELDS_SKIP_RADIO_TEST_ID))
        await user.click(radioIn(ConnectionCategory.Tax, CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID))

        await act(async () => {
          await opened.form.submit()
        })

        expect(onChange).toHaveBeenCalledWith({
          [ConnectionCategory.Accounting]: undefined,
          [ConnectionCategory.Crm]: { behavior: ConnectionBehaviorEnum.Skip },
          [ConnectionCategory.Tax]: { behavior: ConnectionBehaviorEnum.Inherit },
        })
      })
    })

    describe('WHEN a category sits on the specific branch with no code picked', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should block the submit from the %s section',
        async (category) => {
          const { user, onChange, opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          await user.click(radioIn(category, CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))

          await act(async () => {
            await opened.form.submit()
          })

          expect(onChange).not.toHaveBeenCalled()
          expect(mockClose).not.toHaveBeenCalled()
        },
      )
    })
  })

  describe('GIVEN the customer has a default connection for a category', () => {
    describe('WHEN the drawer content mounts', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should name it on the %s inherit option',
        async (category) => {
          const { opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          const chip = within(sectionOf(category)).getByTestId(
            getAdditionalIntegrationDefaultChipTestId(category),
          )

          expect(chip).toHaveTextContent(CONNECTION_BY_CATEGORY[category].code)
          expect(
            within(sectionOf(category)).queryByTestId(
              getAdditionalIntegrationNoDefaultChipTestId(category),
            ),
          ).not.toBeInTheDocument()
        },
      )

      it('THEN should attach the badge to the inherit option only', async () => {
        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        const section = within(sectionOf(ConnectionCategory.Accounting))
        const chipTestId = getAdditionalIntegrationDefaultChipTestId(ConnectionCategory.Accounting)

        expect(
          within(section.getByTestId(CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID)).getByTestId(
            chipTestId,
          ),
        ).toBeInTheDocument()
        expect(
          within(section.getByTestId(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID)).queryByTestId(
            chipTestId,
          ),
        ).not.toBeInTheDocument()
        expect(
          within(section.getByTestId(CONNECTION_FIELDS_SKIP_RADIO_TEST_ID)).queryByTestId(
            chipTestId,
          ),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the customer has no default connection for a category', () => {
    describe('WHEN the drawer content mounts', () => {
      it('THEN should flag that category alone, leaving the others named', async () => {
        mockConnectionsByCategory.current[ConnectionCategory.Crm] = []

        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(
          within(sectionOf(ConnectionCategory.Crm)).getByTestId(
            getAdditionalIntegrationNoDefaultChipTestId(ConnectionCategory.Crm),
          ),
        ).toBeInTheDocument()
        expect(
          within(sectionOf(ConnectionCategory.Crm)).queryByTestId(
            getAdditionalIntegrationDefaultChipTestId(ConnectionCategory.Crm),
          ),
        ).not.toBeInTheDocument()
        expect(
          within(sectionOf(ConnectionCategory.Accounting)).getByTestId(
            getAdditionalIntegrationDefaultChipTestId(ConnectionCategory.Accounting),
          ),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN prepaid credit invoices carry no tax', () => {
    describe('WHEN the drawer content mounts', () => {
      it('THEN should disclaim it under the tax section only', async () => {
        const { opened } = await openDrawerFromSelector()

        render(<>{opened.children}</>)

        expect(
          within(sectionOf(ConnectionCategory.Tax).closest('section') as HTMLElement).getByTestId(
            ADDITIONAL_INTEGRATION_TAX_DISCLAIMER_TEST_ID,
          ),
        ).toBeInTheDocument()
        expect(screen.getAllByTestId(ADDITIONAL_INTEGRATION_TAX_DISCLAIMER_TEST_ID)).toHaveLength(1)
      })
    })
  })

  describe('GIVEN the customer connections are still loading', () => {
    describe('WHEN the drawer content mounts', () => {
      it.each(ADDITIONAL_INTEGRATION_CATEGORIES)(
        'THEN should show no badge on the %s inherit option',
        async (category) => {
          mockConnectionsLoading.current = true
          mockConnectionsByCategory.current[category] = []

          const { opened } = await openDrawerFromSelector()

          render(<>{opened.children}</>)

          expect(
            within(sectionOf(category)).queryByTestId(
              getAdditionalIntegrationNoDefaultChipTestId(category),
            ),
          ).not.toBeInTheDocument()
          expect(
            within(sectionOf(category)).queryByTestId(
              getAdditionalIntegrationDefaultChipTestId(category),
            ),
          ).not.toBeInTheDocument()
        },
      )
    })
  })
})
