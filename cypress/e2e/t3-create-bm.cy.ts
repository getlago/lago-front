import { oneDimensionGroup } from '../support/reusableConstants'

describe('Create billable metrics', () => {
  beforeEach(() => {
    cy.visit('/billable-metrics')
    cy.get('[data-test="create-bm"]').click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/billable-metrics')
  })

  describe('0 dimension', () => {
    it('should create count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm count zero dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="count_agg"]').click()
      cy.get('input[name="fieldName"]').should('not.exist')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create uniq count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm uniq count zero dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="unique_count_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create max billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm max zero dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="max_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create sum billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm sum zero dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="sum_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create recurring count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm recurring count zero dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="recurring_count_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })
  })

  describe('1 dimension', () => {
    it('should create count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm count one dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="count_agg"]').click()
      cy.get('input[name="fieldName"]').should('not.exist')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="dimension-accordion"]').click()
      cy.get('.ace_text-input').first().focus().type(oneDimensionGroup)
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create uniq count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm uniq count one dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="unique_count_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="dimension-accordion"]').click()
      cy.get('.ace_text-input').first().focus().type(oneDimensionGroup)
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create max billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm max one dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="max_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="dimension-accordion"]').click()
      cy.get('.ace_text-input').first().focus().type(oneDimensionGroup)
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create sum billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm sum one dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="sum_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="dimension-accordion"]').click()
      cy.get('.ace_text-input').first().focus().type(oneDimensionGroup)
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })

    it('should create recurring count billable metric', () => {
      const randomId = Math.round(Math.random() * 1000)
      const bmName = `bm recurring count one dimension ${randomId}`

      cy.get('input[name="name"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="code"]').type(bmName)
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('textarea[name="description"]').type('I am a description')
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="aggregationType"]').click()
      cy.get('[data-test="recurring_count_agg"]').click()
      cy.get('[data-test="submit"]').should('be.disabled')
      cy.get('input[name="fieldName"]').type('whatever')
      cy.get('[data-test="submit"]').should('not.be.disabled')
      cy.get('[data-test="dimension-accordion"]').click()
      cy.get('.ace_text-input').first().focus().type(oneDimensionGroup)
      cy.get('[data-test="submit"]').click()
      cy.url().should('be.equal', Cypress.config().baseUrl + '/billable-metrics')
      cy.contains(bmName).should('exist')
    })
  })
})
