import { customerName } from '../../support/reusableConstants'

const couponName = `Coupon-${Math.round(Math.random() * 10000)}`

describe('Coupons', () => {
  it('should be able create a coupon with plan limitation', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="add-coupon"]`).click({ force: true })
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="name"]').type(couponName)
    cy.get('input[name="code"]').type(couponName)
    cy.get('input[name="amountCents"]').type('30')
    cy.get('[data-test="submit"]').should('be.enabled')

    // Set plan limitation
    cy.get('[data-test="checkbox-hasPlanOrBillableMetricLimit"]').click({ force: true })
    cy.get('[data-test="add-plan-limit"]').click({ force: true })
    cy.get('input[name="selectedPlan"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="submitAddPlanToCouponDialog"]').click({ force: true })

    // Submit form
    cy.get('[data-test="submit"]').click({ force: true })
    cy.get(`[data-test="${couponName}"]`).should('exist')
  })

  it('should be able to edit the same coupon', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="${couponName}"]`).click({ force: true })
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="limited-plan-0"]').within(() => {
      cy.get(`[data-test="delete-limited-plan-0"]`).click({ force: true })
    })
    cy.get('[data-test="limited-plan-0"]').should('not.exist')
    cy.get('[data-test="add-plan-limit"]').click({ force: true })
    cy.get('input[name="selectedPlan"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="submitAddPlanToCouponDialog"]').click({ force: true })
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="amountCents"]').type('1')

    cy.get('[data-test="submit"]').click({ force: true })
    cy.get(`[data-test="${couponName}"]`).should('exist')
  })

  it('should be able to apply the coupon to a customer', () => {
    cy.visit('/customers')
    cy.get(`[data-test="${customerName}"]`).click({ force: true })
    cy.get('[data-test="customer-actions"]').click({ force: true })
    cy.get('[data-test="apply-coupon-action"]').click({ force: true })
    cy.get('input[name="selectCoupon"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get(`[data-test="plan-limitation-section"]`).should('exist')

    // Test errors
    cy.get('input[name="amountCurrency"]').click({ force: true })
    cy.get('[data-test="UAH"]').click({ force: true })
    cy.get('[data-test="submit"]').click({ force: true })
    cy.get(`[data-test="alert-type-danger"]`).should('exist', 1)

    // Reset values to be valid
    cy.get('input[name="amountCurrency"]').click({ force: true })
    cy.get('[data-test="USD"]').click({ force: true })

    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="customer-coupon-container"]`).within(() => {
      cy.get(`[data-test="${couponName}"]`).should('exist')
    })
  })

  it('should not able to apply the same coupon to a customer multiple time', () => {
    cy.visit('/customers')
    cy.get(`[data-test="${customerName}"]`).click({ force: true })
    cy.get('[data-test="customer-actions"]').click({ force: true })
    cy.get('[data-test="apply-coupon-action"]').click({ force: true })
    cy.get('input[name="selectCoupon"]').click({ force: true })
    cy.get('[data-option-index="0"]').click({ force: true })
    cy.get('[data-test="submit"]').click({ force: true })
    cy.get(`[data-test="alert-type-danger"]`).should('exist', 1)
  })

  it('should not be able to edit an applied coupon', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="${couponName}"]`).click({ force: true })
    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('be.disabled')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="checkbox-hasPlanOrBillableMetricLimit"] input').should('be.disabled')
    cy.get(`[data-test="delete-limited-plan-1"]`).should('not.exist')
  })
})
