import { configure, render, screen } from '@testing-library/react'

import { ConnectionComboBoxDataItem } from '~/components/customerConnections/ConnectionComboBox'
import type { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import {
  PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID,
  PROVIDER_SELECTION_TITLE_TEST_ID,
  ProviderSelectionSection,
} from '~/components/customerConnections/ProviderSelectionSection'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { useAppForm } from '~/hooks/forms/useAppform'

configure({ testIdAttribute: 'data-test' })

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const PAYMENT_OPTIONS: ConnectionComboBoxDataItem[] = [
  { value: 'stripe-conn', label: 'Stripe EU', subLabel: 'stripe-conn', group: 'stripe' },
  {
    value: 'gocardless-conn',
    label: 'GoCardless',
    subLabel: 'gocardless-conn',
    group: 'gocardless',
  },
  { value: 'adyen-conn', label: 'Adyen', subLabel: 'adyen-conn', group: 'adyen' },
  { value: 'moneyhash-conn', label: 'MoneyHash', subLabel: 'moneyhash-conn', group: 'moneyhash' },
]

const ACCOUNTING_OPTIONS: ConnectionComboBoxDataItem[] = [
  { value: 'netsuite-conn', label: 'NetSuite EU', subLabel: 'netsuite-conn', group: 'Netsuite' },
]

const Harness = ({
  category,
  options,
  providerCode,
  lockedSelection,
}: {
  category: ConnectionCategory
  options: ConnectionComboBoxDataItem[]
  providerCode?: string
  lockedSelection?: { title: string; subtitle?: string; icon: React.ReactNode }
}) => {
  const form = useAppForm({
    defaultValues: {
      providerCode: providerCode as string | undefined,
    },
  })

  return (
    <ProviderSelectionSection
      form={form as unknown as CustomerConnectionDrawerFormApi}
      category={category}
      options={options}
      lockedSelection={lockedSelection}
    />
  )
}

describe('ProviderSelectionSection', () => {
  describe('GIVEN a locked selection (persisted connection)', () => {
    describe('WHEN the section renders', () => {
      it('THEN should display the read-only selector with the connection identity', () => {
        render(
          <Harness
            category={ConnectionCategory.Payment}
            options={PAYMENT_OPTIONS}
            providerCode="stripe-conn"
            lockedSelection={{ title: 'Stripe EU', subtitle: 'stripe-conn', icon: <svg /> }}
          />,
        )

        const selector = screen.getByTestId(PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID)

        expect(selector).toBeInTheDocument()
        expect(selector).toHaveTextContent('Stripe EU')
        expect(selector).toHaveTextContent('stripe-conn')
      })

      it('THEN should not display the provider combobox', () => {
        render(
          <Harness
            category={ConnectionCategory.Payment}
            options={PAYMENT_OPTIONS}
            providerCode="stripe-conn"
            lockedSelection={{ title: 'Stripe EU', icon: <svg /> }}
          />,
        )

        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no locked selection (creation or in-session connection)', () => {
    describe('WHEN the section renders', () => {
      it('THEN should display the provider combobox', () => {
        render(<Harness category={ConnectionCategory.Payment} options={PAYMENT_OPTIONS} />)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })

      it('THEN should not display the read-only selector', () => {
        render(<Harness category={ConnectionCategory.Payment} options={PAYMENT_OPTIONS} />)

        expect(
          screen.queryByTestId(PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID),
        ).not.toBeInTheDocument()
      })

      it('THEN should keep the combobox even when a provider is selected', () => {
        render(
          <Harness
            category={ConnectionCategory.Payment}
            options={PAYMENT_OPTIONS}
            providerCode="stripe-conn"
          />,
        )

        expect(screen.getByRole('combobox')).toBeInTheDocument()
        expect(
          screen.queryByTestId(PROVIDER_SELECTION_LOCKED_SELECTOR_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN the section renders for any category', () => {
      it.each([
        ['payment', ConnectionCategory.Payment, PAYMENT_OPTIONS],
        ['accounting', ConnectionCategory.Accounting, ACCOUNTING_OPTIONS],
        ['tax', ConnectionCategory.Tax, []],
        ['crm', ConnectionCategory.Crm, []],
      ])('THEN should display the %s section title', (_, category, options) => {
        render(<Harness category={category} options={options} />)

        expect(screen.getByTestId(PROVIDER_SELECTION_TITLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a payment provider with a dedicated info alert', () => {
    describe('WHEN that provider is selected', () => {
      it.each([['gocardless-conn'], ['adyen-conn'], ['moneyhash-conn']])(
        'THEN should display the info alert for %s',
        (code) => {
          render(
            <Harness
              category={ConnectionCategory.Payment}
              options={PAYMENT_OPTIONS}
              providerCode={code}
            />,
          )

          expect(screen.getByTestId('alert-type-info')).toBeInTheDocument()
        },
      )
    })

    describe('WHEN a provider without info alert is selected (stripe)', () => {
      it('THEN should not display any info alert', () => {
        render(
          <Harness
            category={ConnectionCategory.Payment}
            options={PAYMENT_OPTIONS}
            providerCode="stripe-conn"
          />,
        )

        expect(screen.queryByTestId('alert-type-info')).not.toBeInTheDocument()
      })
    })

    describe('WHEN nothing is selected yet', () => {
      it('THEN should not display any info alert', () => {
        render(<Harness category={ConnectionCategory.Payment} options={PAYMENT_OPTIONS} />)

        expect(screen.queryByTestId('alert-type-info')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a non-payment category', () => {
    describe('WHEN a connection is selected', () => {
      it('THEN should not display any payment info alert', () => {
        render(
          <Harness
            category={ConnectionCategory.Accounting}
            options={ACCOUNTING_OPTIONS}
            providerCode="netsuite-conn"
          />,
        )

        expect(screen.queryByTestId('alert-type-info')).not.toBeInTheDocument()
      })
    })
  })
})
