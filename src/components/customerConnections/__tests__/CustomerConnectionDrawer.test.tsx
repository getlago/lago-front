import { act, screen } from '@testing-library/react'
import { createRef } from 'react'

import { render } from '~/test-utils'

import {
  ConnectionFormValues,
  CustomerConnectionDrawer,
  CustomerConnectionDrawerRef,
} from '../CustomerConnectionDrawer'
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
  const onSave = overrides?.onSave ?? jest.fn()
  const ref = createRef<CustomerConnectionDrawerRef>()

  render(
    <CustomerConnectionDrawer
      ref={ref}
      onSave={onSave}
      connectionOptions={overrides?.connectionOptions ?? {}}
    />,
  )

  return { ref, onSave }
}

const getLastOpenArgs = () => mockOpen.mock.calls[mockOpen.mock.calls.length - 1][0]

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
        const onSave = jest.fn()
        const { ref } = renderDrawer({ onSave })

        act(() => ref.current?.openDrawer(ConnectionCategory.Payment, VALID_PAYMENT_VALUES))

        await act(async () => {
          await getLastOpenArgs().form.submit()
        })

        expect(onSave).toHaveBeenCalledWith(
          ConnectionCategory.Payment,
          expect.objectContaining({ providerCode: 'stripe-1', externalCustomerId: 'cus_123' }),
          { isEdition: true },
        )
        expect(mockClose).toHaveBeenCalledTimes(1)
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
})
