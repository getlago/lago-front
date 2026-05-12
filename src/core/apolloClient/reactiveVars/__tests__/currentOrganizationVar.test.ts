import { removeItemFromLS, setItemFromLS } from '~/core/apolloClient/cacheUtils'

import {
  currentOrganizationVar,
  getCurrentOrganizationId,
  setCurrentOrganizationId,
} from '../currentOrganizationVar'

// Mock cacheUtils to break circular dependency (cacheUtils → reactiveVars → cacheUtils)
jest.mock('~/core/apolloClient/cacheUtils', () => ({
  getItemFromLS: jest.fn(),
  setItemFromLS: jest.fn(),
  removeItemFromLS: jest.fn(),
}))

describe('currentOrganizationVar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentOrganizationVar(null)
  })

  describe('GIVEN getCurrentOrganizationId is called', () => {
    describe('WHEN the var has not been set', () => {
      it('THEN should return null', () => {
        expect(getCurrentOrganizationId()).toBeNull()
      })
    })

    describe('WHEN the var has been set to an org id', () => {
      it('THEN should return that org id', () => {
        currentOrganizationVar('org-123')

        expect(getCurrentOrganizationId()).toBe('org-123')
      })
    })
  })

  describe('GIVEN setCurrentOrganizationId is called', () => {
    describe('WHEN called with a valid id', () => {
      it('THEN should update the reactive var', () => {
        setCurrentOrganizationId('org-456')

        expect(currentOrganizationVar()).toBe('org-456')
      })

      it('THEN should persist the id to localStorage', () => {
        setCurrentOrganizationId('org-456')

        expect(setItemFromLS).toHaveBeenCalledWith('currentOrganization', 'org-456')
      })

      it('THEN should not call removeItemFromLS', () => {
        setCurrentOrganizationId('org-456')

        expect(removeItemFromLS).not.toHaveBeenCalled()
      })
    })

    describe('WHEN called with null', () => {
      it('THEN should set the reactive var to null', () => {
        currentOrganizationVar('org-existing')

        setCurrentOrganizationId(null)

        expect(currentOrganizationVar()).toBeNull()
      })

      it('THEN should remove the key from localStorage', () => {
        setCurrentOrganizationId(null)

        expect(removeItemFromLS).toHaveBeenCalledWith('currentOrganization')
      })

      it('THEN should not call setItemFromLS', () => {
        setCurrentOrganizationId(null)

        expect(setItemFromLS).not.toHaveBeenCalled()
      })
    })

    describe('WHEN called multiple times', () => {
      it('THEN should reflect the latest value', () => {
        setCurrentOrganizationId('org-1')
        setCurrentOrganizationId('org-2')
        setCurrentOrganizationId('org-3')

        expect(getCurrentOrganizationId()).toBe('org-3')
        expect(setItemFromLS).toHaveBeenCalledTimes(3)
        expect(setItemFromLS).toHaveBeenLastCalledWith('currentOrganization', 'org-3')
      })
    })
  })
})
