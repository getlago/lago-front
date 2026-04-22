// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
// ***********************************************************
import { SIGNUP_SUBMIT_BUTTON_TEST_ID } from '~/pages/auth/signUpTestIds'

import { userEmail, userPassword } from './reusableConstants'

/**
 * Public paths that live outside `/:organizationSlug` and must NOT be
 * prefixed with the org slug when navigating via `cy.visitApp()`.
 * Mirrors `NEVER_SLUG_PREFIXES` in `src/core/router/slugPrefixes.ts`
 * plus the auth routes (`/sign-up`, `/invitation`, `/password-reset`).
 */
const PUBLIC_PATHS = [
  '/login',
  '/sign-up',
  '/invitation',
  '/customer-portal',
  '/forbidden',
  '/404',
  '/password-reset',
  '/forgot-password',
]

/**
 * Regex matching the first authenticated URL after login/signup.
 * `Home.tsx` redirects to `/${slug}/customers` or `/${slug}/analytics`
 * depending on the user's permissions.
 */
const POST_AUTH_URL_RE = /\/[^/]+\/(customers|analytics)/

/**
 * Extracts the org slug from the current URL and stores it in
 * `Cypress.env('orgSlug')` so `cy.visitApp()` can build slug-prefixed
 * paths in subsequent steps.
 */
const captureOrgSlugFromUrl = (): void => {
  cy.url()
    .should('match', POST_AUTH_URL_RE)
    .then((url) => {
      const slug = new URL(url).pathname.split('/')[1]

      if (!slug) throw new Error(`Could not extract org slug from URL: ${url}`)
      Cypress.env('orgSlug', slug)
    })
}

Cypress.Commands.add('login', (email = userEmail, password = userPassword) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('[data-test="submit"]').click()
  captureOrgSlugFromUrl()
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-test="side-nav-user-infos"]').click()
  cy.get('[data-test="side-nav-logout"]').click()
  cy.url().should('include', '/login')
  // Clear the captured slug — subsequent login/signup must re-capture it.
  Cypress.env('orgSlug', undefined)
})

Cypress.Commands.add(
  'signup',
  ({
    organizationName,
    email,
    password,
  }: {
    organizationName: string
    email: string
    password: string
  }) => {
    cy.visit('sign-up')
    cy.get('input[name="organizationName"]').type(organizationName)
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get(`[data-test="${SIGNUP_SUBMIT_BUTTON_TEST_ID}"]`).click()
    captureOrgSlugFromUrl()
  },
)

/**
 * Slug-aware wrapper around `cy.visit()`. Prepends `/${orgSlug}` to any
 * absolute authenticated path so spec files can keep writing
 * `cy.visitApp('/customers')` while the actual navigation targets
 * `/${slug}/customers`. Public paths (login/signup/invitation/…) pass
 * through unchanged.
 *
 * Requires `cy.login()` or `cy.signup()` to have been called first so
 * the slug is available in `Cypress.env('orgSlug')`.
 */
Cypress.Commands.add('visitApp', (path: string) => {
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p))

  if (isPublic) {
    return cy.visit(path)
  }

  const slug = Cypress.env('orgSlug')

  if (!slug) {
    throw new Error(
      `cy.visitApp('${path}') called without a captured org slug. Call cy.login() or cy.signup() first.`,
    )
  }

  const normalized = path.startsWith('/') ? path : `/${path}`

  return cy.visit(`/${slug}${normalized}`)
})

// https://docs.cypress.io/api/cypress-api/custom-commands#Overwrite-type-command
// @ts-expect-error custom command
Cypress.Commands.overwrite('type', (originalFn, element, text, options) => {
  // @ts-expect-error custom options
  return originalFn(element, text, { ...options, delay: 0 })
})

beforeEach(() => {
  // Allow access to broswer's clipboard api
  Cypress.automation('remote:debugger:protocol', {
    command: 'Browser.grantPermissions',
    params: {
      permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
      origin: window.location.origin,
    },
  })
})
