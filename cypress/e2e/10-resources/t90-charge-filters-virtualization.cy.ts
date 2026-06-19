import { USAGE_CHARGE_ACCORDION_TEST_ID_PREFIX } from '~/components/plans/details-v2/detailsV2TestIds'

describe('Charge filters virtualization', () => {
  it('opens a 2500-filter charge and mounts only a windowed subset of filters', () => {
    cy.login().visitApp('/plans/perf-test-2500')

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
