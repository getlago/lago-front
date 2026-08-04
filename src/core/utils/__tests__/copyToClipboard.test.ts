import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'

// Mock addToast function
jest.mock('~/core/apolloClient', () => ({
  addToast: jest.fn(),
}))

Object.assign(window.navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
})

describe('copyToClipboard', () => {
  it('should copy to clipboard', () => {
    copyToClipboard('the text that needs to be copied')

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'the text that needs to be copied',
    )
  })

  it('should filter out comments', () => {
    const value = `# comment
    the text that needs to be copied`

    copyToClipboard(value, { ignoreComment: true })
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'the text that needs to be copied',
    )
  })

  it('should be able to copy when navigator.clipboard is not available', () => {
    // Mock navigator.clipboard to throw error
    const originalClipboard = { ...navigator.clipboard }

    Object.assign(navigator.clipboard, {
      writeText: jest.fn().mockImplementation(() => {
        throw new Error('Clipboard not available')
      }),
    })

    document.execCommand = jest.fn().mockImplementation(() => true)

    const textArea = document.createElement('textarea')
    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(textArea)

    copyToClipboard('fallback text')

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(textArea.value).toBe('fallback text')

    // Restore mocks
    Object.assign(navigator.clipboard, originalClipboard)
    mockCreateElement.mockRestore()
  })

  it('should show error toast when all clipboard methods fail', () => {
    // Mock navigator.clipboard to throw error
    const originalClipboard = { ...navigator.clipboard }

    Object.assign(navigator.clipboard, {
      writeText: jest.fn().mockImplementation(() => {
        throw new Error('Clipboard not available')
      }),
    })

    // Mock document.execCommand to also fail
    document.execCommand = jest.fn().mockImplementation(() => {
      throw new Error('execCommand failed')
    })

    // Should throw error but catch it internally
    expect(() => {
      copyToClipboard('failing text')
    }).toThrow('Unable to copy to clipboard')

    // Verify error toast was called
    expect(addToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: 'text_1745919770448pvibiukolis',
    })

    // Restore mocks
    Object.assign(navigator.clipboard, originalClipboard)
    jest.restoreAllMocks()
  })

  it('should filter out comments when using fallback clipboard method', () => {
    // Mock navigator.clipboard to throw error
    const originalClipboard = { ...navigator.clipboard }

    Object.assign(navigator.clipboard, {
      writeText: jest.fn().mockImplementation(() => {
        throw new Error('Clipboard not available')
      }),
    })

    // Mock document.execCommand
    document.execCommand = jest.fn().mockImplementation(() => true)

    // Create a real textarea to use for the test
    const textArea = document.createElement('textarea')
    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(textArea)

    const value = `# comment
    the text that needs to be copied`

    copyToClipboard(value, { ignoreComment: true })

    // Verify the filtered text was used
    expect(textArea.value).toBe('the text that needs to be copied')
    expect(document.execCommand).toHaveBeenCalledWith('copy')

    // Restore mocks
    Object.assign(navigator.clipboard, originalClipboard)
    mockCreateElement.mockRestore()
    jest.restoreAllMocks()
  })

  describe('GIVEN navigator.clipboard.writeText rejects', () => {
    const originalClipboard = { ...navigator.clipboard }

    const mockRejectedWriteText = (): void => {
      Object.assign(navigator.clipboard, {
        writeText: jest
          .fn()
          .mockRejectedValue(
            new DOMException(
              "Failed to execute 'writeText' on 'Clipboard': Document is not focused.",
              'NotAllowedError',
            ),
          ),
      })
    }

    // The rejection is handled asynchronously: give node a macrotask tick so a leftover
    // rejection would have time to be reported.
    const flushRejection = (): Promise<void> =>
      new Promise((resolve) => {
        setTimeout(resolve, 0)
      })

    beforeEach(() => {
      jest.clearAllMocks()
      mockRejectedWriteText()
    })

    afterEach(() => {
      Object.assign(navigator.clipboard, originalClipboard)
      jest.restoreAllMocks()
    })

    describe('WHEN the fallback succeeds', () => {
      it('THEN should copy the value through the fallback', async () => {
        document.execCommand = jest.fn().mockImplementation(() => true)

        const textArea = document.createElement('textarea')

        jest.spyOn(document, 'createElement').mockReturnValue(textArea)

        copyToClipboard('async fallback text')
        await flushRejection()

        expect(document.execCommand).toHaveBeenCalledWith('copy')
        expect(textArea.value).toBe('async fallback text')
      })

      it('THEN should not display any toast', async () => {
        document.execCommand = jest.fn().mockImplementation(() => true)

        copyToClipboard('async fallback text')
        await flushRejection()

        expect(addToast).not.toHaveBeenCalled()
      })

      it('THEN should filter out comments', async () => {
        document.execCommand = jest.fn().mockImplementation(() => true)

        const textArea = document.createElement('textarea')

        jest.spyOn(document, 'createElement').mockReturnValue(textArea)

        const value = `# comment
    the text that needs to be copied`

        copyToClipboard(value, { ignoreComment: true })
        await flushRejection()

        expect(textArea.value).toBe('the text that needs to be copied')
      })
    })

    describe('WHEN the fallback throws', () => {
      it('THEN should display the error toast', async () => {
        document.execCommand = jest.fn().mockImplementation(() => {
          throw new Error('execCommand failed')
        })

        copyToClipboard('failing async text')
        await flushRejection()

        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: 'text_1745919770448pvibiukolis',
        })
      })
    })

    describe('WHEN the fallback silently fails', () => {
      it('THEN should treat a false execCommand result as a failure', async () => {
        document.execCommand = jest.fn().mockImplementation(() => false)

        copyToClipboard('silently failing text')
        await flushRejection()

        expect(addToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: 'text_1745919770448pvibiukolis',
        })
      })
    })

    describe('WHEN the rejection is handled', () => {
      it.each([
        ['the fallback succeeds', (): boolean => true],
        [
          'the fallback throws',
          (): boolean => {
            throw new Error('execCommand failed')
          },
        ],
        ['the fallback returns false', (): boolean => false],
      ])('THEN should not surface an unhandled rejection when %s', async (_, execCommandImpl) => {
        const onUnhandledRejection = jest.fn()

        process.on('unhandledRejection', onUnhandledRejection)
        document.execCommand = jest.fn().mockImplementation(execCommandImpl)

        try {
          expect(() => {
            copyToClipboard('unhandled rejection text')
          }).not.toThrow()

          await flushRejection()

          expect(onUnhandledRejection).not.toHaveBeenCalled()
        } finally {
          process.removeListener('unhandledRejection', onUnhandledRejection)
        }
      })
    })
  })
})
