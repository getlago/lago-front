import { FieldApi, FormApi } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'

import {
  clearCustomerServerError,
  computeCustomerInitials,
  getCustomerFieldErrors,
  getInitials,
  setCustomerServerErrors,
  syncCustomerShippingAddress,
} from '~/components/customers/utils'
import { LagoApiError } from '~/generated/graphql'

const buildErrors = (details: Record<string, unknown>): GraphQLFormattedError[] => [
  { message: 'Unprocessable Entity', extensions: { code: 'unprocessable_entity', details } },
]

const TOO_LONG_255_KEY = 'text_1793265036704cnkqwk0atap'
const TOO_LONG_500_KEY = 'text_17932959847757c9xwcz2ltv'
const INVALID_CHARACTERS_KEY = 'text_1793265036704k3gcjfhp5lo'

describe('customerUtils', () => {
  describe('getInitials', () => {
    describe('one word', () => {
      it('should return the first letter of the single word', () => {
        expect(getInitials('First')).toEqual('F')
      })
    })

    describe('multiple words', () => {
      it('should return the first letter of the two words', () => {
        expect(getInitials('First Second')).toEqual('FS')
      })

      it('should return the first letter of all the words', () => {
        expect(getInitials('First Second Third')).toEqual('FST')
      })
    })
  })

  describe('computeCustomerInitials', () => {
    describe('name', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago' })).toEqual('L')
      })
    })

    describe('name + firstname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', firstname: 'Stefan' })).toEqual('L')
      })
    })

    describe('name + lastname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', lastname: 'World' })).toEqual('L')
      })
    })

    describe('name + firstname + lastname', () => {
      it('should return the initial of the name', () => {
        expect(
          computeCustomerInitials({ name: 'Lago', firstname: 'Stefan', lastname: 'World' }),
        ).toEqual('L')
      })
    })

    describe('firstname', () => {
      it('should return the initial of the firstname', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan' })).toEqual('S')
      })
    })

    describe('firstname + lastname', () => {
      it('should return the initial of both names', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan', lastname: 'World' })).toEqual('SW')
      })
    })

    describe('lastname', () => {
      it('should return the initial of the last name', () => {
        expect(computeCustomerInitials({ lastname: 'World' })).toEqual('W')
      })
    })
  })

  describe('getCustomerFieldErrors', () => {
    describe('GIVEN a value_is_too_long error', () => {
      it.each([
        ['shippingAddressLine2', 'shippingAddress.addressLine2', TOO_LONG_500_KEY],
        ['shippingZipcode', 'shippingAddress.zipcode', TOO_LONG_255_KEY],
        ['addressLine1', 'addressLine1', TOO_LONG_500_KEY],
        ['legalName', 'legalName', TOO_LONG_255_KEY],
      ])('THEN should map %s to %s with the %s message', (key, path, message) => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ [key]: [LagoApiError.ValueIsTooLong] }),
        })

        expect(fields).toEqual({ [path]: { message } })
      })
    })

    describe('GIVEN a billingAddressPath', () => {
      it.each([
        ['city', 'billingAddress.city'],
        ['name', 'name'],
        ['shippingCity', 'shippingAddress.city'],
      ])('THEN should map %s to %s', (key, path) => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ [key]: [LagoApiError.ValueIsTooLong] }),
          billingAddressPath: 'billingAddress',
        })

        expect(Object.keys(fields)).toEqual([path])
      })
    })

    describe('GIVEN an invalid_characters error', () => {
      it('THEN should use the invalid characters message', () => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ name: [LagoApiError.InvalidCharacters] }),
        })

        expect(fields.name.message).toBe(INVALID_CHARACTERS_KEY)
      })
    })

    describe('GIVEN only mapped field errors', () => {
      it('THEN hasOnlyFieldErrors should be true', () => {
        const { hasOnlyFieldErrors } = getCustomerFieldErrors({
          errors: buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
        })

        expect(hasOnlyFieldErrors).toBe(true)
      })
    })

    describe('GIVEN errors that are not all mapped to a field', () => {
      it.each([
        ['an unrelated detail code', buildErrors({ externalId: ['value_already_exist'] })],
        [
          'a mix of mapped and unrelated codes',
          buildErrors({ city: [LagoApiError.ValueIsTooLong], email: ['invalid_email_format'] }),
        ],
        [
          'a handled and an unhandled code on the same field',
          buildErrors({ city: [LagoApiError.ValueIsTooLong, 'value_is_invalid'] }),
        ],
        ['a non-array detail', buildErrors({ error: 'Stripe: resource_missing' })],
        ['no details', [{ message: 'Internal error', extensions: { code: 'internal_error' } }]],
        [
          'several errors',
          [
            ...buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
            ...buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
          ],
        ],
        ['no errors', undefined],
      ])('THEN hasOnlyFieldErrors should be false for %s', (_, errors) => {
        const { hasOnlyFieldErrors } = getCustomerFieldErrors({ errors })

        expect(hasOnlyFieldErrors).toBe(false)
      })

      it('THEN should ignore unrelated codes', () => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({
            externalId: ['value_already_exist'],
            error: 'Stripe: resource_missing',
          }),
        })

        expect(fields).toEqual({})
      })
    })
  })

  describe('setCustomerServerErrors', () => {
    const setup = () => {
      const form = new FormApi({
        defaultValues: { name: '', city: '' },
        listeners: { onChange: clearCustomerServerError },
      })
      const nameField = new FieldApi({ form, name: 'name' })
      const cityField = new FieldApi({ form, name: 'city' })

      form.mount()
      nameField.mount()
      cityField.mount()

      setCustomerServerErrors(form, {
        name: { message: TOO_LONG_255_KEY },
        unknownField: { message: TOO_LONG_255_KEY },
      })

      return { form, nameField, cityField }
    }

    describe('GIVEN a server error on a field', () => {
      it('THEN should show it on that field only', () => {
        const { form } = setup()

        expect(form.getFieldMeta('name')?.errors).toEqual([{ message: TOO_LONG_255_KEY }])
        expect(form.getFieldMeta('city')?.errors).toEqual([])
      })
    })

    describe('WHEN another field changes', () => {
      it('THEN should keep the server error', () => {
        const { form, cityField } = setup()

        cityField.handleChange('Paris')

        expect(form.getFieldMeta('name')?.errors).toEqual([{ message: TOO_LONG_255_KEY }])
      })
    })

    describe('WHEN the field itself changes', () => {
      it('THEN should clear the server error', () => {
        const { form, nameField } = setup()

        nameField.handleChange('Acme')

        expect(form.getFieldMeta('name')?.errors).toEqual([])
      })
    })
  })
})

describe('synchronized shipping validation', () => {
  it.each([undefined, 'billingAddress'])(
    'maps shipping errors to editable billing (%s)',
    (billingAddressPath) => {
      const { fields } = getCustomerFieldErrors({
        errors: buildErrors({ shippingAddressLine1: ['value_is_too_long'] }),
        billingAddressPath,
        isShippingEqualBillingAddress: true,
      })

      expect(fields).toEqual({
        [billingAddressPath ? 'billingAddress.addressLine1' : 'addressLine1']: {
          message: TOO_LONG_500_KEY,
        },
      })
    },
  )

  it('allows a second submission after correcting synchronized billing', async () => {
    const onSubmit = jest.fn()
    const form = new FormApi({
      defaultValues: {
        addressLine1: 'a'.repeat(501),
        shippingAddress: { addressLine1: 'a'.repeat(501) },
      },
      listeners: { onChange: clearCustomerServerError },
      onSubmit,
    })
    const billing = new FieldApi({
      form,
      name: 'addressLine1',
      listeners: {
        onChange: () => {
          syncCustomerShippingAddress(form, { addressLine1: form.state.values.addressLine1 })
        },
      },
    })
    const shipping = new FieldApi({ form, name: 'shippingAddress.addressLine1' })

    form.mount()
    billing.mount()
    shipping.mount()
    await form.handleSubmit()
    const { fields } = getCustomerFieldErrors({
      errors: buildErrors({ shippingAddressLine1: ['value_is_too_long'] }),
      isShippingEqualBillingAddress: true,
    })

    setCustomerServerErrors(form, fields)
    expect(billing.state.meta.errors).toHaveLength(1)
    billing.handleChange('valid address')
    expect(shipping.state.value).toBe('valid address')
    await form.handleSubmit()
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('clears a shipping error when synchronization replaces the invalid value', () => {
    const form = new FormApi({ defaultValues: { shippingAddress: { city: 'old city' } } })
    const field = new FieldApi({ form, name: 'shippingAddress.city' })

    form.mount()
    field.mount()
    setCustomerServerErrors(form, { 'shippingAddress.city': { message: TOO_LONG_255_KEY } })
    syncCustomerShippingAddress(form, { city: 'Paris' })
    expect(field.state.meta.errors).toEqual([])
    expect(field.state.value).toBe('Paris')
  })
})
