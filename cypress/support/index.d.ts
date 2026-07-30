/// <reference types="cypress" />

declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    /**
     * Login user. Captures the org slug from the post-login URL and stores
     * it in `Cypress.env('orgSlug')` so subsequent `cy.visitApp()` calls
     * work without manual setup.
     * @example
     * cy.login('usertest@lago.com', 'P@ssw0rd')
     */
    login(email?: string, password?: string): Chainable<unknown>

    /**
     * Logout current user. Clears the captured org slug so any subsequent
     * `cy.visitApp()` call throws unless re-login/signup happens first.
     * @example
     * cy.logout()
     */
    logout(): Chainable<unknown>

    /**
     * Signup user. Same slug-capture behavior as `cy.login()`.
     * @example
     * cy.signup({ organizationName: 'Lago', email: 'user@lago.com', password: 'P@ssw0rd' })
     */
    signup({
      organizationName,
      email,
      password,
    }: {
      organizationName: string
      email: string
      password: string
    }): Chainable<unknown>

    /**
     * Slug-aware `cy.visit()` wrapper. Prepends `/${orgSlug}` to
     * authenticated paths; public paths (`/login`, `/sign-up`, `/invitation`,
     * `/customer-portal`, `/forbidden`, `/404`, `/password-reset`,
     * `/forgot-password`) pass through unchanged.
     *
     * Requires `cy.login()` or `cy.signup()` to have been called first.
     *
     * @example
     * cy.visitApp('/customers')            // → /${slug}/customers
     * cy.visitApp('/login')                // → /login (public, unchanged)
     */
    visitApp(path: string): Chainable<Cypress.AUTWindow>

    /**
     * Yields the running org's premium state, captured from the
     * `getCurrentUserInfos` response during `cy.login()` / `cy.signup()`.
     * Defaults to `false` if neither has run.
     *
     * Premium is off on fork/community PRs because CI enables it via the
     * `LAGO_LICENSE` secret and GitHub does not pass secrets to fork
     * `pull_request` runs. Branch premium-gated steps on this so fork CI
     * stays green regardless of license.
     * @example
     * cy.getIsPremium().then((isPremium) => { ... })
     */
    getIsPremium(): Chainable<boolean>

    /**
     * Runs `fn` only when the org is premium. Wrap e2e steps that click a
     * premium-gated control (graduated-percentage model, percentage min/max,
     * spending minimum, minimum commitment, progressive billing, …).
     * @example
     * cy.whenPremium(() => { cy.get('[data-test="graduated-percentage"]').click() })
     */
    whenPremium(fn: () => void): Chainable<unknown>

    /**
     * Runs `fn` only when the org is NOT premium — typically to assert the
     * premium gate / `PremiumWarningDialog` shows instead of the control.
     * @example
     * cy.whenNotPremium(() => { cy.get('[data-test="premium-warning-dialog"]').should('exist') })
     */
    whenNotPremium(fn: () => void): Chainable<unknown>
  }

  interface Cypress {
    mocha: any // for Cypress.mocha
  }
}
