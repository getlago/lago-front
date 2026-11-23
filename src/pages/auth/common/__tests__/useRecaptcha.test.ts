import { renderHook } from '@testing-library/react'

import { loadRecaptcha, unloadRecaptcha } from '~/core/utils/recaptcha'

import { useRecaptcha, useRecaptchaCleanup } from '../useRecaptcha'

jest.mock('~/core/utils/recaptcha', () => ({
  loadRecaptcha: jest.fn(() => Promise.resolve(undefined)),
  unloadRecaptcha: jest.fn(),
}))

const mockedLoadRecaptcha = jest.mocked(loadRecaptcha)
const mockedUnloadRecaptcha = jest.mocked(unloadRecaptcha)

describe('useRecaptcha', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a page using it', () => {
    describe('WHEN the page mounts', () => {
      it('THEN should start loading reCAPTCHA once', () => {
        renderHook(() => useRecaptcha())

        expect(mockedLoadRecaptcha).toHaveBeenCalledTimes(1)
        expect(mockedUnloadRecaptcha).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the page re-renders', () => {
      it('THEN should not load reCAPTCHA again', () => {
        const { rerender } = renderHook(() => useRecaptcha())

        rerender()

        expect(mockedLoadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the page unmounts', () => {
      it('THEN should unload reCAPTCHA', () => {
        const { unmount } = renderHook(() => useRecaptcha())

        unmount()

        expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('useRecaptchaCleanup', () => {
    describe('WHEN the page mounts', () => {
      it('THEN should not load reCAPTCHA', () => {
        renderHook(() => useRecaptchaCleanup())

        expect(mockedLoadRecaptcha).not.toHaveBeenCalled()
        expect(mockedUnloadRecaptcha).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the page unmounts', () => {
      it('THEN should unload reCAPTCHA', () => {
        const { unmount } = renderHook(() => useRecaptchaCleanup())

        unmount()

        expect(mockedUnloadRecaptcha).toHaveBeenCalledTimes(1)
      })
    })
  })
})
