import NiceModal from '@ebay/nice-modal-react'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { AllTheProviders } from '~/test-utils'

import { AppliedRateCardContext } from '../types'
import { useAppliedRateCardRowActions } from '../useAppliedRateCardRowActions'

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

const wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
  <AllTheProviders>
    <NiceModal.Provider>{children}</NiceModal.Provider>
  </AllTheProviders>
)

const renderRemoval = (
  context: AppliedRateCardContext,
  isRemovalLocked: boolean,
): ReturnType<typeof useAppliedRateCardRowActions>['removal'] =>
  renderHook(
    () =>
      useAppliedRateCardRowActions({
        context,
        parentId: 'parent-1',
        isRemovalLocked,
        onRemoved: jest.fn(),
      }),
    { wrapper },
  ).result.current.removal

describe('useAppliedRateCardRowActions', () => {
  describe.each([
    {
      context: 'plan' as const,
      permission: 'plansUpdate',
    },
    {
      context: 'contract' as const,
      permission: 'contractsUpdate',
    },
  ])('GIVEN the $context context', ({ context, permission }) => {
    it('THEN checks its own update permission and hides removal without it', () => {
      mockHasPermissions.mockReturnValue(false)

      expect(renderRemoval(context, false)).toEqual({ status: 'hidden' })
      expect(mockHasPermissions).toHaveBeenCalledWith([permission])
    })

    it('THEN disables removal when locked', () => {
      mockHasPermissions.mockReturnValue(true)

      expect(renderRemoval(context, true)).toEqual({ status: 'disabled' })
    })

    it('THEN enables removal when permitted and unlocked', () => {
      mockHasPermissions.mockReturnValue(true)

      expect(renderRemoval(context, false)).toEqual({ status: 'enabled' })
    })
  })
})
