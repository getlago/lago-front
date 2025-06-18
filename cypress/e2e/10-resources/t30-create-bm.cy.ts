describe('Create billable metrics', () => {
  beforeEach(() => {
    cy.login().visit('/billable-metrics')
  })

  it('should create count billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm count ${randomId}`
    const bmCode = `bm_count_${randomId}`

    cy.get('button[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="count_agg"]').click()
    cy.get('input[name="fieldName"]').should('not.exist')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })

  it('should create uniq count billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm uniq count ${randomId}`
    const bmCode = `bm_uniq_count_${randomId}`

    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="unique_count_agg"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="fieldName"]').type('whatever')
    cy.get('[data-test="button-selector-true"]').click()
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })

  it('should create max billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm max ${randomId}`
    const bmCode = `bm_max_${randomId}`

    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="max_agg"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="fieldName"]').type('whatever')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })

  it('should create sum billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm sum ${randomId}`
    const bmCode = `bm_sum_${randomId}`

    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="sum_agg"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="fieldName"]').type('whatever')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })

  it('should create recurring count billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm recurring count ${randomId}`
    const bmCode = `bm_recurring_count_${randomId}`

    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="count_agg"]').click()
    cy.get('input[name="fieldName"]').should('not.exist')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })

  it('should create recurring count billable metric', () => {
    const randomId = Math.round(Math.random() * 1000)
    const bmName = `bm weighted sum ${randomId}`
    const bmCode = `bm_weighted_sum_${randomId}`

    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
    cy.get('input[name="name"]').type(bmName)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="recurring-switch"] [data-test="button-selector-true"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="code"]').should('have.value', bmCode)
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type('I am a description')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="aggregationType"]').click()
    cy.get('[data-test="weighted_sum_agg"]').click()
    cy.get('input[name="fieldName"]').type('whatever')
    cy.get('[data-test="submit"]').should('not.be.disabled')
    cy.get('[data-test="submit"]').click()
    cy.url().should('include', '/billable-metric/')
    cy.contains(bmName).should('exist')
  })
})
