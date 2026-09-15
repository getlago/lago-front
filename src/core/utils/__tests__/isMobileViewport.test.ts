import { isMobileViewport } from '../isMobileViewport'

describe('isMobileViewport', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it.each([
    [0, true],
    [599, true],
    [600, true],
    [639, true],
    [640, true],
    [775, true],
    [775.5, true],
    [776, false],
    [1024, false],
    [1600, false],
  ])('returns %s pixels as mobile: %s', (width, expected) => {
    window.innerWidth = width

    expect(isMobileViewport()).toBe(expected)
  })

  it('reads the current width on every call without a resize event', () => {
    window.innerWidth = 776
    expect(isMobileViewport()).toBe(false)

    window.innerWidth = 775.5
    expect(isMobileViewport()).toBe(true)

    window.innerWidth = 1024
    expect(isMobileViewport()).toBe(false)
  })
})
