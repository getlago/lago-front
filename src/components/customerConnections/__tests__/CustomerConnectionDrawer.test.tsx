import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'

import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { render } from '~/test-utils'

import {
  CONNECTION_CODE_FIELD_TEST_ID,
  ConnectionFormValues,
  CustomerConnectionDrawer,
  CustomerConnectionDrawerFormApi,
  CustomerConnectionDrawerRef,
} from '../CustomerConnectionDrawer'
import { MANUAL_CONNECTION_CODE } from '../customerIntegrationConst'
import { CONNECTION_CATEGORY_SHORT_LABEL_KEYS, ConnectionCategory } from '../types'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const FORM_ID = 'customer-connection-drawer-form'

const VALID_PAYMENT_VALUES: Partial<ConnectionFormValues> = {
  providerCode: 'stripe-1',
  providerType: 'stripe',
  externalCustomerId: 'cus_123',
  syncWithProvider: false,
  providerPaymentMethods: { card: true },
}

const renderDrawer = (overrides?: {
  onSave?: jest.Mock
  connectionOptions?: Record<string, unknown>
}) => {
  // onSave reports whether the values were saved — the drawer closes on true
  const onSave = overrides?.onSave ?? jest.fn().mockResolvedValue(true)
  const ref = createRef<CustomerConnectionDrawerRef>()
  // The provider-content slot is handed the drawer's live form: the only seam
  // reaching it from outside, the form itself being internal to the drawer
  const formRef: { current: CustomerConnectionDrawerFormApi | null } = { current: null }

  render(
    <CustomerConnectionDrawer
      ref={ref}
      onSave={onSave}
      connectionOptions={overrides?.connectionOptions ?? {}}
      renderProviderContent={(form) => {
        formRef.current = form

        return null
      }}
    />,
  )

  return { ref, onSave, formRef }
}

const getLastOpenArgs = () => mockOpen.mock.calls[mockOpen.mock.calls.length - 1][0]

const getCodeInput = (): HTMLInputElement =>
  screen.getByTestId(CONNECTION_CODE_FIELD_TEST_ID).querySelector('input') as HTMLInputElement

describe('CustomerConnectionDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the drawer is opened in create mode', () => {
    describe('WHEN openDrawer is called with a category', () => {
      it('THEN should open the form drawer with the connection form contract', () => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment))

        expect(mockOpen).toHaveBeenCalledTimes(1)

        const args = getLastOpenArgs()

        expect(args.form.id).toBe(FORM_ID)
        expect(args.closeOnSubmitSuccess).toBe(false)
        expect(typeof args.form.submit).toBe('function')
        expect(args.children).toBeTruthy()
        expect(args.mainAction).toBeTruthy()
      })

      it.each([
        ['payment', ConnectionCategory.Payment],
        ['accounting', ConnectionCategory.Accounting],
        ['tax', ConnectionCategory.Tax],
        ['crm', ConnectionCategory.Crm],
      ])('THEN should title the drawer with the %s short label', (_, category) => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(category))

        expect(getLastOpenArgs().title).toBe(CONNECTION_CATEGORY_SHORT_LABEL_KEYS[category])
      })

      it('THEN should report a clean (not dirty) close baseline', () => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment))

        expect(getLastOpenArgs().shouldPromptOnClose()).toBe(false)
      })
    })

    describe('WHEN the form is submitted with invalid values', () => {
      it('THEN should not persist and not close the drawer', async () => {
        const { ref, onSave } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment))

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the drawer is opened in edit mode with valid values', () => {
    describe('WHEN the form is submitted', () => {
      it('THEN should persist through onSave (isEdition true) and close the drawer', async () => {
        const onSave = jest.fn().mockResolvedValue(true)
        const { ref } = renderDrawer({ onSave })

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, VALID_PAYMENT_VALUES))

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({ providerCode: 'stripe-1', externalCustomerId: 'cus_123' }),
          { isEdition: true, formApi: expect.anything() },
        )
        expect(mockClose).toHaveBeenCalledTimes(1)
      })

      it('THEN should keep the drawer open, without rejecting, when onSave reports a failure', async () => {
        const onSave = jest.fn().mockResolvedValue(false)
        const { ref } = renderDrawer({ onSave })

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, VALID_PAYMENT_VALUES))

        // Must RESOLVE: BaseDrawer calls form.submit() without catching, so a
        // rejection here would escape as an unhandled promise rejection
        await act(async () => {
          await expect(getLastOpenArgs().form.submit()).resolves.toBeUndefined()
        })

        expect(onSave).toHaveBeenCalledTimes(1)
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a locked provider selection (edit of a persisted connection)', () => {
    describe('WHEN the drawer content renders', () => {
      it('THEN should show the locked selection and hide the provider combobox', () => {
        const { ref } = renderDrawer()

        act(() =>
          ref.current?.openDrawer(
            ConnectionCategory.Payment,
            { providerCode: 'stripe-1' },
            { title: 'My Stripe', subtitle: 'stripe-1', icon: null },
          ),
        )

        render(<>{getLastOpenArgs().children}</>)

        expect(screen.getByText('My Stripe')).toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an unlocked provider selection (create)', () => {
    describe('WHEN the drawer content renders', () => {
      it('THEN should show the provider combobox', () => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment))

        render(<>{getLastOpenArgs().children}</>)

        expect(screen.getByRole('combobox')).toBeInTheDocument()
      })
    })
  })
  describe('GIVEN the connection code field', () => {
    describe('WHEN the drawer content renders', () => {
      it.each([
        ['create', undefined],
        ['edit', VALID_PAYMENT_VALUES],
      ])('THEN should display the code input in %s mode', (_, initialValues) => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, initialValues))

        render(<>{getLastOpenArgs().children}</>)

        expect(screen.getByTestId(CONNECTION_CODE_FIELD_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should leave the code empty on a connection that has none', () => {
        const { ref } = renderDrawer()

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, VALID_PAYMENT_VALUES))

        render(<>{getLastOpenArgs().children}</>)

        expect(getCodeInput()).toHaveValue('')
      })

      it('THEN should stay editable on a connection whose provider is locked', () => {
        const { ref } = renderDrawer()

        act(() =>
          ref.current?.openDrawer(
            ConnectionCategory.Payment,
            { ...VALID_PAYMENT_VALUES, code: 'stripe-eu' },
            { title: 'My Stripe', subtitle: 'stripe-1', icon: null },
          ),
        )

        render(<>{getLastOpenArgs().children}</>)

        expect(getCodeInput()).toHaveValue('stripe-eu')
        expect(getCodeInput()).not.toBeDisabled()
      })
    })

    describe('WHEN the provider is switched after the drawer opened', () => {
      it.each([
        ['leave an empty code empty', '', ''],
        ['keep the code the connection was loaded with', 'stripe-eu', 'stripe-eu'],
      ])('THEN should %s, the code never deriving from the provider', (_, code, expected) => {
        const { ref, formRef } = renderDrawer()

        act(() =>
          ref.current?.openDrawer(ConnectionCategory.Payment, { ...VALID_PAYMENT_VALUES, code }),
        )

        render(<>{getLastOpenArgs().children}</>)

        act(() => formRef.current?.setFieldValue('providerCode', 'stripe-2'))

        expect(getCodeInput()).toHaveValue(expected)
      })
    })

    describe('WHEN the code is edited after the backend rejected it as already used', () => {
      it('THEN should clear the error so the form can be submitted again', async () => {
        const { ref, formRef } = renderDrawer()

        act(() =>
          ref.current?.openDrawer(ConnectionCategory.Payment, {
            ...VALID_PAYMENT_VALUES,
            code: 'already-used',
          }),
        )

        render(<>{getLastOpenArgs().children}</>)

        const formApi = formRef.current

        if (!formApi) throw new Error('the drawer form was not captured')

        act(() => applyExistingCodeError(formApi))

        expect(formApi.getFieldMeta('code')?.errorMap?.onDynamic).toBeTruthy()

        await userEvent.type(getCodeInput(), '-2')

        expect(formApi.getFieldMeta('code')?.errorMap?.onDynamic).toBeUndefined()
      })
    })

    describe('WHEN the form is submitted', () => {
      it('THEN should persist the typed code', async () => {
        const onSave = jest.fn().mockResolvedValue(true)
        const { ref } = renderDrawer({ onSave })

        act(() =>
          ref.current?.openDrawer(ConnectionCategory.Payment, {
            ...VALID_PAYMENT_VALUES,
            code: 'stripe-eu',
          }),
        )

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({ code: 'stripe-eu' }),
          expect.anything(),
        )
      })

      it('THEN should refuse the reserved manual code, which the customer payload would destroy', async () => {
        const onSave = jest.fn().mockResolvedValue(true)
        const { ref } = renderDrawer({ onSave })

        act(() =>
          ref.current?.openDrawer(ConnectionCategory.Payment, {
            ...VALID_PAYMENT_VALUES,
            code: MANUAL_CONNECTION_CODE,
          }),
        )

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).not.toHaveBeenCalled()
        expect(mockClose).not.toHaveBeenCalled()
      })

      it('THEN should submit with an empty code, the field being optional', async () => {
        const onSave = jest.fn().mockResolvedValue(true)
        const { ref } = renderDrawer({ onSave })

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, VALID_PAYMENT_VALUES))

        render(<>{getLastOpenArgs().children}</>)

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({ code: '' }),
          expect.anything(),
        )
      })
    })
  })
})
