describe('customerPortalTokenVar', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorage.clear()
  })

  describe('GIVEN a portal token to remember', () => {
    describe('WHEN it is written to the var', () => {
      it('THEN should keep it in memory only', async () => {
        const { customerPortalTokenVar, updateCustomerPortalTokenVar } =
          await import('../customerPortalTokenVar')

        updateCustomerPortalTokenVar('token-x')

        expect(customerPortalTokenVar()).toBe('token-x')
        // Regression: the token used to be persisted, and localStorage is shared
        // by every tab, so a second portal overwrote the first one's credentials.
        expect(localStorage.length).toBe(0)
      })
    })

    describe('WHEN it is cleared', () => {
      it('THEN should reset the var', async () => {
        const { customerPortalTokenVar, updateCustomerPortalTokenVar } =
          await import('../customerPortalTokenVar')

        updateCustomerPortalTokenVar('token-x')
        updateCustomerPortalTokenVar()

        expect(customerPortalTokenVar()).toBeUndefined()
      })
    })
  })

  describe('GIVEN a token persisted by an older build', () => {
    describe('WHEN the module loads', () => {
      it('THEN should start empty and drop the stored token', async () => {
        localStorage.setItem('customerPortalToken', 'another-customers-token')

        const { customerPortalTokenVar } = await import('../customerPortalTokenVar')

        expect(customerPortalTokenVar()).toBeUndefined()
        expect(localStorage.getItem('customerPortalToken')).toBeNull()
      })
    })
  })
})
