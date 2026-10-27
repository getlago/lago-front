import { cleanup, screen } from '@testing-library/react'

import { PaymentTypeEnum, ProviderTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { getPaymentProviderChipType, PaymentProviderChip } from '../PaymentProviderChip'

describe('PaymentProviderChip', () => {
  afterEach(cleanup)

  describe('WHEN paymentProvider is undefined', () => {
    it('THEN should return null', () => {
      const { container } = render(<PaymentProviderChip paymentProvider={undefined} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('WHEN rendering a payment provider', () => {
    it('THEN should render Stripe provider with icon and translated label', () => {
      render(<PaymentProviderChip paymentProvider={ProviderTypeEnum.Stripe} />)

      // Check that the component renders
      expect(screen.getByText('Stripe')).toBeInTheDocument()
    })
  })

  describe('WHEN rendering an x402 payment', () => {
    it('THEN should render the Coinbase x402 label', () => {
      render(<PaymentProviderChip paymentProvider="x402" />)

      expect(screen.getByText('Coinbase x402')).toBeInTheDocument()
    })
  })

  describe('getPaymentProviderChipType', () => {
    it.each([
      [PaymentTypeEnum.Provider, ProviderTypeEnum.Stripe, 'manual', ProviderTypeEnum.Stripe],
      [PaymentTypeEnum.Manual, null, 'manual', 'manual'],
      [PaymentTypeEnum.Manual, null, 'manual_long', 'manual_long'],
      [PaymentTypeEnum.X402, null, 'manual', 'x402'],
      [undefined, null, 'manual', undefined],
    ] as const)(
      'GIVEN a %s payment from %s THEN returns %s',
      (paymentType, paymentProviderType, manualVariant, expected) => {
        expect(
          getPaymentProviderChipType({ paymentType, paymentProviderType, manualVariant }),
        ).toBe(expected)
      },
    )
  })

  describe('WHEN rendering manual payment provider', () => {
    it('THEN should render manual with receipt icon and short label', () => {
      render(<PaymentProviderChip paymentProvider="manual" />)

      expect(screen.getByText('Manual')).toBeInTheDocument()
    })

    it('THEN should render manual_long with receipt icon and long label', () => {
      render(<PaymentProviderChip paymentProvider="manual_long" />)

      expect(screen.getByText('Manual payment')).toBeInTheDocument()
    })
  })

  describe('WHEN custom label is provided', () => {
    it('THEN should use custom label instead of default translated label', () => {
      render(
        <PaymentProviderChip
          paymentProvider={ProviderTypeEnum.Stripe}
          label="Custom Stripe Label"
        />,
      )

      expect(screen.getByText('Custom Stripe Label')).toBeInTheDocument()
      expect(screen.queryByText('Stripe')).not.toBeInTheDocument()
    })
  })
})
