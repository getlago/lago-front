import { addToast } from '~/core/apolloClient'
import {
  handleDownloadFile,
  handleDownloadFileWithCors,
  openNewTab,
} from '~/core/utils/downloadFile'

jest.mock('~/core/apolloClient', () => ({ addToast: jest.fn() }))

const fileUrl = 'https://example.com/invoice.pdf'

describe('file downloads', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it.each([handleDownloadFile, openNewTab])(
    'defers opening, then navigates and focuses without closing for %p',
    (download) => {
      const fileWindow = {
        location: { href: 'about:blank' },
        focus: jest.fn(),
        close: jest.fn(),
      }
      const open = jest.spyOn(window, 'open').mockReturnValue(fileWindow as unknown as Window)

      fileWindow.focus.mockImplementation(() => {
        expect(fileWindow.location.href).toBe(fileUrl)
      })
      download(fileUrl)
      expect(open).not.toHaveBeenCalled()

      jest.advanceTimersByTime(0)
      expect(open).toHaveBeenCalledWith('', '_blank')
      expect(fileWindow.focus).toHaveBeenCalledTimes(1)
      jest.advanceTimersByTime(1000)
      expect(fileWindow.close).not.toHaveBeenCalled()
      expect(addToast).not.toHaveBeenCalled()
    },
  )

  it('closes a CORS download tab 500ms after opening it', () => {
    const fileWindow = {
      location: { href: 'about:blank' },
      focus: jest.fn(),
      close: jest.fn(),
    }
    const open = jest.spyOn(window, 'open').mockReturnValue(fileWindow as unknown as Window)

    handleDownloadFileWithCors(fileUrl)
    expect(open).not.toHaveBeenCalled()
    jest.advanceTimersByTime(0)
    expect(fileWindow.location.href).toBe(fileUrl)
    expect(fileWindow.focus).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(499)
    expect(fileWindow.close).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(fileWindow.close).toHaveBeenCalledTimes(1)
    expect(addToast).not.toHaveBeenCalled()
  })

  it.each([handleDownloadFile, handleDownloadFileWithCors])(
    'reports missing URLs immediately for %p',
    (download) => {
      const open = jest.spyOn(window, 'open')

      for (const url of [undefined, null, '']) {
        download(url)
      }

      expect(addToast).toHaveBeenCalledTimes(3)
      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        translateKey: 'text_1760517105743y1n6z2u1063',
      })
      jest.runAllTimers()
      expect(open).not.toHaveBeenCalled()
    },
  )

  it.each([handleDownloadFile, handleDownloadFileWithCors, openNewTab])(
    'reports a blocked popup for %p',
    (download) => {
      jest.spyOn(window, 'open').mockReturnValue(null)

      download(fileUrl)
      expect(addToast).not.toHaveBeenCalled()
      jest.runAllTimers()
      expect(addToast).toHaveBeenCalledTimes(1)
      expect(addToast).toHaveBeenCalledWith({
        severity: 'danger',
        translateKey: 'text_1760517105743y1n6z2u1063',
      })
    },
  )

  it.each([handleDownloadFile, handleDownloadFileWithCors, openNewTab])(
    'closes an unusable popup and reports the download error for %p',
    (download) => {
      const fileWindow = { location: { href: '' }, focus: jest.fn(), close: jest.fn() }

      jest.spyOn(window, 'open').mockReturnValue(fileWindow as unknown as Window)
      download(fileUrl)
      jest.runAllTimers()
      expect(fileWindow.close).toHaveBeenCalledTimes(1)
      expect(fileWindow.focus).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledTimes(1)
    },
  )
})
