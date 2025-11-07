import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'

import { createMockPaymentMethod } from './factories/PaymentMethod.factory'

import { generatePaymentMethodsActions } from '../actions'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

describe('generatePaymentMethodsActions', () => {
  const mockTranslate = jest.fn((key: string) => key)
  const mockSetPaymentMethodAsDefault = jest.fn().mockResolvedValue(undefined)
  const mockDestroyPaymentMethod = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN generating actions', () => {
    it('THEN returns three actions', () => {
      const actions = generatePaymentMethodsActions({
        translate: mockTranslate,
        setPaymentMethodAsDefault: mockSetPaymentMethodAsDefault,
        destroyPaymentMethod: mockDestroyPaymentMethod,
      })

      const setAsDefaultAction = actions.find((action) => action.startIcon === 'star-filled')
      const copyAction = actions.find((action) => action.startIcon === 'duplicate')
      const deleteAction = actions.find((action) => action.startIcon === 'trash')

      expect(setAsDefaultAction).toBeDefined()
      expect(copyAction).toBeDefined()
      expect(deleteAction).toBeDefined()
    })
  })

  describe('WHEN executing set as default action', () => {
    it('THEN calls setPaymentMethodAsDefault with correct input and shows success toast', async () => {
      const actions = generatePaymentMethodsActions({
        translate: mockTranslate,
        setPaymentMethodAsDefault: mockSetPaymentMethodAsDefault,
        destroyPaymentMethod: mockDestroyPaymentMethod,
      })

      const paymentMethod = createMockPaymentMethod({ id: 'pm_test_001' })
      const setAsDefaultAction = actions.find((action) => action.startIcon === 'star-filled')

      expect(setAsDefaultAction).toBeDefined()
      await setAsDefaultAction?.onAction(paymentMethod)

      expect(mockSetPaymentMethodAsDefault).toHaveBeenCalledWith({ id: 'pm_test_001' })

      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
        }),
      )
    })
  })

  describe('WHEN executing copy action', () => {
    it('THEN copies payment method id to clipboard and shows info toast', () => {
      const actions = generatePaymentMethodsActions({
        translate: mockTranslate,
        setPaymentMethodAsDefault: mockSetPaymentMethodAsDefault,
        destroyPaymentMethod: mockDestroyPaymentMethod,
      })

      const paymentMethod = createMockPaymentMethod({ id: 'pm_copy_001' })
      const copyAction = actions.find((action) => action.startIcon === 'duplicate')

      expect(copyAction).toBeDefined()
      copyAction?.onAction(paymentMethod)

      expect(copyToClipboard).toHaveBeenCalledWith('pm_copy_001')

      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'info',
        }),
      )
    })
  })

  describe('WHEN executing delete action', () => {
    it('THEN calls destroyPaymentMethod with correct input and shows success toast', async () => {
      const actions = generatePaymentMethodsActions({
        translate: mockTranslate,
        setPaymentMethodAsDefault: mockSetPaymentMethodAsDefault,
        destroyPaymentMethod: mockDestroyPaymentMethod,
      })

      const paymentMethod = createMockPaymentMethod({ id: 'pm_delete_001' })
      const deleteAction = actions.find((action) => action.startIcon === 'trash')

      expect(deleteAction).toBeDefined()
      await deleteAction?.onAction(paymentMethod)

      expect(mockDestroyPaymentMethod).toHaveBeenCalledWith({ id: 'pm_delete_001' })

      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
        }),
      )
    })
  })
})
