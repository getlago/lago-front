import { act, renderHook } from '@testing-library/react'
import { ReactNode } from 'react'

import { useExportFinanceAssistant } from '~/components/aiAgent/hooks/useExportFinanceAssistant'
import { ExportFinanceAssistantResultDocument } from '~/generated/graphql'
import { AllTheProviders, TestMocksType } from '~/test-utils'

const buildWrapper = (mocks: TestMocksType) => {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AllTheProviders mocks={mocks} forceTypenames>
        {children}
      </AllTheProviders>
    )
  }
}

const exportMock = (result: { fileUrl: string; filename: string } | null) => ({
  request: {
    query: ExportFinanceAssistantResultDocument,
    variables: { input: { messageId: 'message-1' } },
  },
  result: {
    data: {
      exportFinanceAssistantResult: result
        ? { __typename: 'FinanceAssistantExport', ...result }
        : null,
    },
  },
})

describe('useExportFinanceAssistant', () => {
  let clickSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  describe('GIVEN an export is requested', () => {
    describe('WHEN the mutation returns a file url', () => {
      it('THEN should trigger the download and return the result', async () => {
        const { result } = renderHook(() => useExportFinanceAssistant(), {
          wrapper: buildWrapper([
            exportMock({ fileUrl: 'https://files.example/export.csv', filename: 'export.csv' }),
          ]),
        })

        let exported

        await act(async () => {
          exported = await result.current.exportResult('message-1')
        })

        expect(exported).toEqual(
          expect.objectContaining({
            fileUrl: 'https://files.example/export.csv',
            filename: 'export.csv',
          }),
        )
        expect(clickSpy).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the mutation returns no file url', () => {
      it('THEN should not trigger a download and return undefined', async () => {
        const { result } = renderHook(() => useExportFinanceAssistant(), {
          wrapper: buildWrapper([exportMock(null)]),
        })

        let exported

        await act(async () => {
          exported = await result.current.exportResult('message-1')
        })

        expect(exported).toBeUndefined()
        expect(clickSpy).not.toHaveBeenCalled()
      })
    })
  })
})
