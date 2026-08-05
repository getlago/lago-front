import { act, renderHook } from '@testing-library/react'
import { MutableRefObject } from 'react'

import { CustomerConnectionDrawerRef } from '../CustomerConnectionDrawer'
import { ConnectionCategory } from '../types'
import { useCustomerConnectionDrawer } from '../useCustomerConnectionDrawer'

const makeRefMock = (): CustomerConnectionDrawerRef => ({
  openDrawer: jest.fn(),
  closeDrawer: jest.fn(),
})

describe('useCustomerConnectionDrawer', () => {
  describe('GIVEN the hook is mounted', () => {
    describe('WHEN reading its return value', () => {
      it('THEN should expose a drawerRef and the two openers', () => {
        const { result } = renderHook(() => useCustomerConnectionDrawer())

        expect(result.current.drawerRef).toBeDefined()
        expect(typeof result.current.openCreate).toBe('function')
        expect(typeof result.current.openEdit).toBe('function')
      })

      it('THEN should keep a stable identity across re-renders', () => {
        const { result, rerender } = renderHook(() => useCustomerConnectionDrawer())
        const first = result.current

        rerender()

        expect(result.current).toBe(first)
      })
    })
  })

  describe('GIVEN the drawer ref is attached', () => {
    describe('WHEN openCreate is called', () => {
      it('THEN should call openDrawer with only the category', () => {
        const { result } = renderHook(() => useCustomerConnectionDrawer())
        const ref = makeRefMock()

        ;(
          result.current.drawerRef as MutableRefObject<CustomerConnectionDrawerRef | null>
        ).current = ref

        act(() => result.current.openCreate(ConnectionCategory.Payment))

        expect(ref.openDrawer).toHaveBeenCalledTimes(1)
        expect(ref.openDrawer).toHaveBeenCalledWith(ConnectionCategory.Payment)
      })
    })

    describe('WHEN openEdit is called with initial values and a locked selection', () => {
      it('THEN should forward the category, values and locked selection to openDrawer', () => {
        const { result } = renderHook(() => useCustomerConnectionDrawer())
        const ref = makeRefMock()

        ;(
          result.current.drawerRef as MutableRefObject<CustomerConnectionDrawerRef | null>
        ).current = ref

        const initialValues = { providerCode: 'stripe-1' }
        const lockedSelection = { title: 'Stripe', subtitle: 'stripe-1', icon: null }

        act(() => result.current.openEdit(ConnectionCategory.Tax, initialValues, lockedSelection))

        expect(ref.openDrawer).toHaveBeenCalledWith(
          ConnectionCategory.Tax,
          initialValues,
          lockedSelection,
        )
      })
    })

    describe('WHEN openEdit is called without a locked selection', () => {
      it('THEN should forward an undefined locked selection', () => {
        const { result } = renderHook(() => useCustomerConnectionDrawer())
        const ref = makeRefMock()

        ;(
          result.current.drawerRef as MutableRefObject<CustomerConnectionDrawerRef | null>
        ).current = ref

        const initialValues = { providerCode: 'hubspot-1' }

        act(() => result.current.openEdit(ConnectionCategory.Crm, initialValues))

        expect(ref.openDrawer).toHaveBeenCalledWith(
          ConnectionCategory.Crm,
          initialValues,
          undefined,
        )
      })
    })
  })

  describe('GIVEN no drawer ref is attached', () => {
    describe('WHEN an opener is called', () => {
      it('THEN should not throw thanks to the optional-chaining guard', () => {
        const { result } = renderHook(() => useCustomerConnectionDrawer())

        expect(() => act(() => result.current.openCreate(ConnectionCategory.Crm))).not.toThrow()
        expect(() =>
          act(() => result.current.openEdit(ConnectionCategory.Payment, {})),
        ).not.toThrow()
      })
    })
  })
})
