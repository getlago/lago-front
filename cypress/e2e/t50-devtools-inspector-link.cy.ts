import {
  DEVTOOLS_COPY_INSPECTOR_LINK_TEST_ID,
  DEVTOOLS_TAB_WEBHOOKS_TEST_ID,
} from '~/components/developers/utils/dataTestConstants'

import { userEmail, userPassword } from '../support/reusableConstants'

// The devtools address a copied inspector link carries, as `?devtool-tab=` holds it.
const devtoolsAddress = '/devtool/webhooks'
const inspectorLinkPath = `/analytics?devtool-tab=${encodeURIComponent(devtoolsAddress)}`

const expectPanelOpenOnWebhooks = (): void => {
  cy.get(`[data-test="${DEVTOOLS_COPY_INSPECTOR_LINK_TEST_ID}"]`).should('exist')
  cy.get(`[data-test="${DEVTOOLS_TAB_WEBHOOKS_TEST_ID}"]`).should(
    'have.attr',
    'aria-selected',
    'true',
  )
  // The panel used to stay closed behind a generic error toast from `DevtoolsErrorBoundary`.
  cy.get('[data-test="toast/danger"]').should('not.exist')
  cy.url().should('not.include', 'devtool-tab')
}

describe('Devtools inspector link', () => {
  it('should open the devtools panel on the linked tab from a copied inspector link', () => {
    cy.login()

    cy.visitApp(inspectorLinkPath)

    expectPanelOpenOnWebhooks()
  })

  it('should reopen the devtools panel after the link is opened while logged out', () => {
    cy.login()
    cy.logout()

    // Slug-less path on purpose: logged out, the auth guard fires before the org slug
    // resolves, saves `location.state.from` (search string included) and redirects to
    // `/login`. `Home` restores it after login. Logging in through the form here rather
    // than with `cy.login()`, which re-visits `/login` and would drop that state.
    cy.visit(inspectorLinkPath)
    cy.url().should('include', '/login')

    cy.get('input[name="email"]').type(userEmail)
    cy.get('input[name="password"]').type(userPassword)
    cy.get('[data-test="submit"]').click()

    expectPanelOpenOnWebhooks()
  })
})
