import { renderHook } from '@testing-library/react'

import { StatusType } from '~/components/designSystem'
import { AllTheProviders } from '~/test-utils'

import { useGetStatusDetails } from '../useGetStatusDetails'

// Mock the useInternationalization hook
const mockTranslate = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: mockTranslate,
  }),
}))

describe('useGetStatusDetails', () => {
  beforeEach(() => {
    mockTranslate.mockClear()
    // Set up default return values for translate function
    mockTranslate.mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        text_65281f686a80b400c8e2f6d1: 'Default',
        text_6630e3210c13c500cd398e9a: 'Undefined',
        text_17272714562192y06u5okvo4: 'Mapped',
      }

      return translations[key] || key
    })
  })

  const renderUseGetStatusDetails = () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) =>
      AllTheProviders({ children })

    return renderHook(() => useGetStatusDetails(), {
      wrapper: customWrapper,
    })
  }

  describe('when mappingInfos is undefined', () => {
    it('should return disabled status when columnId is not null', () => {
      const { result } = renderUseGetStatusDetails()
      const statusDetails = result.current.getStatusDetails(undefined, 'some-column-id')

      expect(statusDetails).toEqual({
        type: StatusType.disabled,
        label: 'Default',
      })
      expect(mockTranslate).toHaveBeenCalledWith('text_65281f686a80b400c8e2f6d1')
    })

    it('should return warning status when columnId is null', () => {
      const { result } = renderUseGetStatusDetails()
      const statusDetails = result.current.getStatusDetails(undefined, null)

      expect(statusDetails).toEqual({
        type: StatusType.warning,
        label: 'Undefined',
      })
      expect(mockTranslate).toHaveBeenCalledWith('text_6630e3210c13c500cd398e9a')
    })
  })

  describe('when mappingInfos is provided', () => {
    it('should return success status with mapped label when name is empty', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: 'test-id', name: '' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: 'Mapped',
      })
      expect(mockTranslate).toHaveBeenCalledWith('text_17272714562192y06u5okvo4')
    })

    it('should return success status with name only when id is undefined', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: undefined, name: 'Test Name' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: 'Test Name',
      })
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('should return success status with name only when id is empty string', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: '', name: 'Test Name' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: 'Test Name',
      })
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('should return success status with name and id when both are provided', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: 'test-id', name: 'Test Name' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: 'Test Name (test-id)',
      })
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('should handle falsy id values correctly', () => {
      const { result } = renderUseGetStatusDetails()

      // Test with id as undefined explicitly
      const mappingInfosWithUndefinedId = { id: undefined, name: 'Test Name' }
      const statusDetailsWithUndefinedId = result.current.getStatusDetails(
        mappingInfosWithUndefinedId,
        'column-id',
      )

      expect(statusDetailsWithUndefinedId).toEqual({
        type: StatusType.success,
        label: 'Test Name',
      })

      // Test with id as 0 (falsy but should be included)
      const mappingInfosWithZeroId = { id: '0', name: 'Test Name' }
      const statusDetailsWithZeroId = result.current.getStatusDetails(
        mappingInfosWithZeroId,
        'column-id',
      )

      expect(statusDetailsWithZeroId).toEqual({
        type: StatusType.success,
        label: 'Test Name (0)',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty name with undefined id', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: undefined, name: '' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: 'Mapped',
      })
      expect(mockTranslate).toHaveBeenCalledWith('text_17272714562192y06u5okvo4')
    })

    it('should handle whitespace-only name', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: 'test-id', name: '   ' }
      const statusDetails = result.current.getStatusDetails(mappingInfos, 'column-id')

      expect(statusDetails).toEqual({
        type: StatusType.success,
        label: '    (test-id)',
      })
      expect(mockTranslate).not.toHaveBeenCalled()
    })

    it('should work regardless of columnId value when mappingInfos is provided', () => {
      const { result } = renderUseGetStatusDetails()
      const mappingInfos = { id: 'test-id', name: 'Test Name' }

      // Test with null columnId
      const statusDetailsWithNullColumn = result.current.getStatusDetails(mappingInfos, null)

      expect(statusDetailsWithNullColumn.type).toBe(StatusType.success)
      expect(statusDetailsWithNullColumn.label).toBe('Test Name (test-id)')

      // Test with string columnId
      const statusDetailsWithStringColumn = result.current.getStatusDetails(
        mappingInfos,
        'column-id',
      )

      expect(statusDetailsWithStringColumn.type).toBe(StatusType.success)
      expect(statusDetailsWithStringColumn.label).toBe('Test Name (test-id)')
    })
  })
})
