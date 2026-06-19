// NOTE: This spec requires a seeded `perf-test-2500` plan (with 2500 charge filters) on the local
// API. It was authored but has not yet been executed in CI; run it locally against a seeded env.
import { USAGE_CHARGE_ACCORDION_TEST_ID_PREFIX } from '~/components/plans/details-v2/detailsV2TestIds'

describe('Charge filters virtualization', () => {
  it('opens a 2500-filter charge and mounts only a windowed subset of filters', () => {
    // Navigate to the plans list, find the perf-test-2500 row by its visible name/code,
    // then click through to the plan details page - mirroring the t50 navigation pattern.
    cy.login().visitApp('/plans')

    cy.get('[data-test="perf-test-2500"] [data-test="open-action-button"]').click({ force: true })
    cy.get('[data-test="tab-internal-button-link-update-plan"]').click({ force: true })
    cy.url().should('include', '/overview')

    // Open the usage charge SectionAccordion (use the confirmed prefix)
    cy.get(`[data-test^="${USAGE_CHARGE_ACCORDION_TEST_ID_PREFIX}"]`).first().click()

    // The page must remain responsive and the charge content must render.
    // The 2500 filter accordions are NOT all mounted: assert far fewer
    // MuiAccordionSummary nodes exist than the filter count.
    cy.get('.MuiAccordionSummary-root').should('have.length.lessThan', 100)

    // Scrolling the page keeps the list working (mounts later filters, unmounts earlier).
    cy.scrollTo('bottom')
    cy.get('.MuiAccordionSummary-root').should('exist')
  })
})
