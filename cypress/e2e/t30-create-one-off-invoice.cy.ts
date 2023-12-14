import { customerName } from '../support/reusableConstants'

// TODO: uncomment when CI e2e api setup is fixed
describe('Create one-off', () => {
  it('runs this test', () => {
    expect(true).to.equal(true)
  })
  // it('should create a one-off invoice with correct amounts', () => {
  //   cy.visit('/customers')
  //   cy.get(`[data-test="${customerName}"]`).click({ force: true })
  //   cy.get('[data-test="customer-actions"]').click({ force: true })
  //   cy.get('[data-test="create-invoice-action"]').click({ force: true })
  //   cy.url().should('include', '/create-invoice')

  //   // Add one item
  //   cy.get('[data-test="add-item-button"]').click({ force: true })
  //   cy.get('[data-option-index="0"]').click({ force: true })
  //   cy.get('[data-test="invoice-item"]').should('have.length', 1)

  //   // // Edit it's tax rate
  //   // cy.get('[data-test="invoice-item-actions-button"]').click({ force: true })
  //   // cy.get('[data-test="invoice-item-edit-taxes"]').click({ force: true })
  //   // cy.get(`[data-test="add-tax-button"]`).click({ force: true })
  //   // cy.get(`.${SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`)
  //   //   .last()
  //   //   .click({ force: true })
  //   // cy.get('[data-option-index="1"]').click({ force: true })
  //   // cy.get('[data-test="edit-invoice-item-tax-dialog-submit-button"]').click({ force: true })

  //   // Add another item
  //   cy.get('[data-test="add-item-button"]').click({ force: true })
  //   cy.get('[data-option-index="0"]').click({ force: true })
  //   cy.get('[data-test="invoice-item"]').should('have.length', 2)

  //   // cy.get('[data-test="one-off-invoice-tax-item-0"]').should('exist')
  //   // cy.get('[data-test="one-off-invoice-tax-item-1"]').should('exist')
  //   // cy.get('[data-test="one-off-invoice-tax-item-2"]').should('not.exist')

  //   cy.get('[data-test="one-off-invoice-subtotal-value"]').should('have.text', '$6,040.00')
  //   cy.get('[data-test="one-off-invoice-tax-item-no-tax-label"]').should('have.text', 'Tax (0%)')
  //   cy.get('[data-test="one-off-invoice-tax-item-no-tax-value"]').should('have.text', '$0.00')
  //   // cy.get('[data-test="one-off-invoice-tax-item-0-label"]').should('have.text', 'twenty (20%)')
  //   // cy.get('[data-test="one-off-invoice-tax-item-0-value"]').should('have.text', '$604.00')
  //   // cy.get('[data-test="one-off-invoice-tax-item-1-label"]').should('have.text', 'ten (10%)')
  //   // cy.get('[data-test="one-off-invoice-tax-item-1-value"]').should('have.text', '$604.00')
  //   cy.get('[data-test="one-off-invoice-subtotal-amount-due-value"]').should(
  //     'have.text',
  //     '$6,040.00'
  //   )
  //   cy.get('[data-test="one-off-invoice-total-amount-due-value"]').should('have.text', '$6,040.00')

  //   cy.get('[data-test="create-invoice-button"]').click({ force: true })

  //   // Check created invoice amounts display
  //   cy.get(`[data-test="customer-navigation-wrapper"]`).within(() => {
  //     cy.get('[data-test="tab-internal-button-link-invoices"]').last().click({ force: true })
  //   })
  //   cy.get('[data-test="invoice-list-item-0"]').should('exist')

  //   cy.get('[data-test="invoice-list-item-0"] a').click({ force: true })
  //   cy.url().should('include', '/overview')

  //   cy.get('[data-test="invoice-details-table-footer-subtotal-excl-tax-value"]').should(
  //     'have.text',
  //     '$6,040.00'
  //   )
  //   // cy.get('[data-test="invoice-details-table-footer-tax-0-label"]').should(
  //   //   'have.text',
  //   //   'twenty (20% on $3,020.00)'
  //   // )
  //   // cy.get('[data-test="invoice-details-table-footer-tax-0-value"]').should('have.text', '$604.00')
  //   // cy.get('[data-test="invoice-details-table-footer-tax-1-label"]').should(
  //   //   'have.text',
  //   //   'ten (10% on $6,040.00)'
  //   // )
  //   // cy.get('[data-test="invoice-details-table-footer-tax-1-value"]').should('have.text', '$604.00')
  //   cy.get('[data-test="invoice-details-table-footer-subtotal-incl-tax-value"]').should(
  //     'have.text',
  //     '$6,040.00'
  //   )
  //   cy.get('[data-test="invoice-details-table-footer-total-value"]').should(
  //     'have.text',
  //     '$6,040.00'
  //   )
  // })

  // describe('anti-regression', () => {
  //   it('should allow to edit the units and have an effect on totals', () => {
  //     cy.visit('/customers')
  //     cy.get(`[data-test="${customerName}"]`).click({ force: true })
  //     cy.get('[data-test="customer-actions"]').click({ force: true })
  //     cy.get('[data-test="create-invoice-action"]').click({ force: true })
  //     cy.url().should('include', '/create-invoice')

  //     // Add one item
  //     cy.get('[data-test="add-item-button"]').click({ force: true })
  //     cy.get('[data-option-index="0"]').click({ force: true })
  //     cy.get('[data-test="invoice-item"]').should('have.length', 1)

  //     // Edit it's tax rate
  //     // cy.get('[data-test="invoice-item-actions-button"]').click({ force: true })
  //     // cy.get('[data-test="invoice-item-edit-taxes"]').click({ force: true })
  //     // cy.get(`[data-test="add-tax-button"]`).click({ force: true })
  //     // cy.get(`.${SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`)
  //     //   .last()
  //     //   .click({ force: true })
  //     // cy.get('[data-option-index="1"]').click({ force: true })
  //     // cy.get('[data-test="edit-invoice-item-tax-dialog-submit-button"]').click({ force: true })

  //     // Update it's units
  //     cy.get('input[name="fees.0.units"]').clear()
  //     cy.get('input[name="fees.0.units"]').type('3')

  //     // Check displayed amounts
  //     cy.get('[data-test="one-off-invoice-subtotal-value"]').should('have.text', '$9,060.00')
  //     cy.get('[data-test="one-off-invoice-tax-item-no-tax-label"]').should('have.text', 'Tax (0%)')
  //     cy.get('[data-test="one-off-invoice-tax-item-no-tax-value"]').should('have.text', '$0.00')
  //     // cy.get('[data-test="one-off-invoice-tax-item-0-label"]').should('have.text', 'twenty (20%)')
  //     // cy.get('[data-test="one-off-invoice-tax-item-0-value"]').should('have.text', '$1,812.00')
  //     // cy.get('[data-test="one-off-invoice-tax-item-1-label"]').should('have.text', 'ten (10%)')
  //     // cy.get('[data-test="one-off-invoice-tax-item-1-value"]').should('have.text', '$906.00')
  //     cy.get('[data-test="one-off-invoice-subtotal-amount-due-value"]').should(
  //       'have.text',
  //       '$9,060.00'
  //     )
  //     cy.get('[data-test="one-off-invoice-total-amount-due-value"]').should(
  //       'have.text',
  //       '$9,060.00'
  //     )
  //   })
  // })
})
