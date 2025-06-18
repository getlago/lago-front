describe('Add On', () => {
  beforeEach(() => {
    cy.login()
  })

  const randomId = Math.round(Math.random() * 10000)
  const addOnName = `AddOn ${randomId}`
  const addOnCode = `addon_${randomId}`
  const description =
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Necessitatibus aliquam at dolor consectetur tempore quis molestiae cumque voluptatem deserunt similique blanditiis aperiam, distinctio nam, asperiores enim officiis culpa aut. Molestias?'

  it('should be able create an add on with all attributes filled', () => {
    // Navigation
    cy.visit('/add-ons')
    cy.get(`[data-test="create-addon-cta"]`).click()
    cy.url().should('be.equal', Cypress.config().baseUrl + '/create/add-on')

    // Basic form infos
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="name"]').type(addOnName)
    cy.get('input[name="code"]').should('have.value', addOnCode)
    cy.get('input[name="amountCents"]').type('30')
    cy.get('[data-test="submit"]').should('be.enabled')
    cy.get('[data-test="show-description"]').click()
    cy.get('textarea[name="description"]').type(description)
    // // Add taxes
    // cy.get('[data-test="show-add-taxes"]').click()
    // cy.get('[data-option-index="0"]').click()
    // cy.get('[data-test="tax-chip-wrapper"]').children().should('have.length', 1)

    // Submit form
    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="addon-details-name"]`).should('contain.text', addOnName)
  })

  it('should be able to edit the same coupon', () => {
    // Navigation
    cy.visit('/add-ons')
    cy.get(`[data-test="${addOnName}"]`).click()

    cy.get('button[data-test="addon-details-actions"]').click()
    cy.get('button[data-test="addon-details-edit"]').click()

    // // Check taxes are still present
    // cy.get('[data-test="tax-chip-wrapper"]').children().should('have.length', 1)

    // Update field and submit
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('textarea[name="description"]').should('exist')
    cy.get('input[name="amountCents"]').type('20')
    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="addon-details-name"]`).should('contain.text', addOnName)
  })
})
