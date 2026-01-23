import MainNavLayout, {
  MAIN_NAV_LAYOUT_CONTENT_TEST_ID,
  MAIN_NAV_LAYOUT_SPINNER_TEST_ID,
  MAIN_NAV_LAYOUT_WRAPPER_TEST_ID,
} from '../MainNavLayout'

describe('MainNavLayout', () => {
  describe('Test ID constants', () => {
    it('exports expected test ID constants', () => {
      expect(MAIN_NAV_LAYOUT_WRAPPER_TEST_ID).toBe('main-nav-layout-wrapper')
      expect(MAIN_NAV_LAYOUT_SPINNER_TEST_ID).toBe('main-nav-layout-spinner')
      expect(MAIN_NAV_LAYOUT_CONTENT_TEST_ID).toBe('main-nav-layout-content')
    })

    it('test ID constants follow kebab-case naming convention', () => {
      const testIds = [
        MAIN_NAV_LAYOUT_WRAPPER_TEST_ID,
        MAIN_NAV_LAYOUT_SPINNER_TEST_ID,
        MAIN_NAV_LAYOUT_CONTENT_TEST_ID,
      ]

      testIds.forEach((testId) => {
        expect(testId).toMatch(/^[a-z-]+$/)
      })
    })
  })

  describe('Component exports', () => {
    it('exports successfully', () => {
      expect(MainNavLayout).toBeDefined()
      expect(typeof MainNavLayout).toBe('function')
    })
  })
})
