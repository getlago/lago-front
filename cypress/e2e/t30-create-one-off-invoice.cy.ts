import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME,
} from '~/core/constants/form'

import { customerName } from '../support/reusableConstants'

describe('Create one-off', () => {
  it('should create a one-off invoice', () => {
    cy.visit('/customers')
    cy.get(`[data-test="${customerName}"]`).click()
    cy.get('[data-test="customer-actions"]').click()
    cy.get('[data-test="create-invoice-action"]').click()
    cy.url().should('include', '/create-invoice')

    // Add one item
    cy.get('[data-test="add-item-button"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="invoice-item"]').should('have.length', 1)

    // Edit it's tax rate
    cy.get('[data-test="invoice-item-actions-button"]').click()
    cy.get('[data-test="invoice-item-edit-taxes"]').click()
    cy.get(`[data-test="add-tax-button"]`).click()
    cy.get(`.${SEARCH_TAX_INPUT_FOR_INVOICE_ADD_ON_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`)
      .last()
      .click()
    cy.get('[data-option-index="1"]').click()
    cy.get('[data-test="edit-invoice-item-tax-dialog-submit-button"]').click()

    // Add another item
    cy.get('[data-test="add-item-button"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="invoice-item"]').should('have.length', 2)

    cy.get('[data-test="one-off-invoice-tax-item-0"]').should('exist')
    cy.get('[data-test="one-off-invoice-tax-item-1"]').should('exist')
    cy.get('[data-test="one-off-invoice-tax-item-2"]').should('not.exist')

    cy.get('[data-test="one-off-invoice-subtotal-value"]').should('have.text', '$6,040.00')
    cy.get('[data-test="one-off-invoice-tax-item-0-label"]').should('have.text', 'twenty (20%)')
    cy.get('[data-test="one-off-invoice-tax-item-0-value"]').should('have.text', '$604.00')
    cy.get('[data-test="one-off-invoice-tax-item-1-label"]').should('have.text', 'ten (10%)')
    cy.get('[data-test="one-off-invoice-tax-item-1-value"]').should('have.text', '$604.00')
    cy.get('[data-test="one-off-invoice-subtotal-amount-due-value"]').should(
      'have.text',
      '$7,248.00'
    )
    cy.get('[data-test="one-off-invoice-total-amount-due-value"]').should('have.text', '$7,248.00')

    cy.get('[data-test="create-invoice-button"]').click()

    // Check created invoice amounts display
    cy.get(`[data-test="customer-navigation-wrapper"]`).within(() => {
      cy.get('[data-test="tab-internal-button-link-invoices"]').last().click()
    })
    cy.get('[data-test="invoice-list-item-0"]').should('exist')
    cy.get('[data-test="invoice-list-item-1"]').should('not.exist')

    cy.get('[data-test="invoice-list-item-0"] a').click()
    cy.url().should('include', '/overview')

    cy.get('[data-test="invoice-details-table-footer-subtotal-excl-tax-value"]').should(
      'have.text',
      '$6,040.00'
    )
    cy.get('[data-test="invoice-details-table-footer-tax-0-label"]').should(
      'have.text',
      'twenty (20% on $3,020.00)'
    )
    cy.get('[data-test="invoice-details-table-footer-tax-0-value"]').should('have.text', '$604.00')
    cy.get('[data-test="invoice-details-table-footer-tax-1-label"]').should(
      'have.text',
      'ten (10% on $6,040.00)'
    )
    cy.get('[data-test="invoice-details-table-footer-tax-1-value"]').should('have.text', '$604.00')
    cy.get('[data-test="invoice-details-table-footer-subtotal-incl-tax-value"]').should(
      'have.text',
      '$7,248.00'
    )
    cy.get('[data-test="invoice-details-table-footer-total-value"]').should(
      'have.text',
      '$7,248.00'
    )
  })
})
