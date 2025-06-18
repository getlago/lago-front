import { customerName } from '../../support/reusableConstants'

const randomId = Math.round(Math.random() * 10000)
const couponName = `Coupon ${randomId}`
const couponCode = `coupon_${randomId}`

describe('Coupons', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should be able create a coupon with plan limitation', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="add-coupon"]`).click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="name"]').type(couponName)
    cy.get('input[name="code"]').should('have.value', couponCode)
    cy.get('input[name="amountCents"]').type('30')
    cy.get('[data-test="submit"]').should('be.enabled')

    // Set plan limitation
    cy.get('[data-test="checkbox-hasPlanOrBillableMetricLimit"]').click()
    cy.get('[data-test="add-plan-limit"]').click()
    cy.get('input[name="selectedPlan"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="submitAddPlanToCouponDialog"]').click()

    // Submit form
    cy.get('[data-test="submit"]').click()
    cy.get('[data-test="coupon-details-name"]').should('contain.text', couponName)
  })

  it('should be able to edit the same coupon', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="${couponName}"]`).click()

    cy.get(`button[data-test="coupon-details-actions"]`).click()
    cy.get(`button[data-test="coupon-details-edit"]`).click()

    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="limited-plan-0"]').within(() => {
      cy.get(`[data-test="delete-limited-plan-0"]`).click()
    })
    cy.get('[data-test="limited-plan-0"]').should('not.exist')
    cy.get('[data-test="add-plan-limit"]').click()
    cy.get('input[name="selectedPlan"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="submitAddPlanToCouponDialog"]').click()
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('input[name="amountCents"]').type('1')

    cy.get('[data-test="submit"]').click()
    cy.get('[data-test="coupon-details-name"]').should('contain.text', couponName)
  })

  it('should be able to apply the coupon to a customer', () => {
    cy.visit('/customers')
    cy.get('[data-test="table-customers-list"] tr').contains(customerName).click()
    cy.get('[data-test="customer-actions"]').click()
    cy.get('[data-test="apply-coupon-action"]').click()
    cy.get('input[name="selectCoupon"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get(`[data-test="plan-limitation-section"]`).should('exist')

    // Test errors
    cy.get('input[name="amountCurrency"]').click()
    cy.get('[data-test="UAH"]').click()
    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="alert-type-danger"]`).should('exist', 1)

    // Reset values to be valid
    cy.get('input[name="amountCurrency"]').click()
    cy.get('[data-test="USD"]').click()

    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="customer-coupon-container"]`).within(() => {
      cy.get(`[data-test="${couponName}"]`).should('exist')
    })
  })

  it('should not be able to apply the same coupon to a customer multiple time', () => {
    cy.visit('/customers')
    cy.get('[data-test="table-customers-list"] tr').contains(customerName).click()
    cy.get('[data-test="customer-actions"]').click()
    cy.get('[data-test="apply-coupon-action"]').click()
    cy.get('input[name="selectCoupon"]').click()
    cy.get('[data-option-index="0"]').click()
    cy.get('[data-test="submit"]').click()
    cy.get(`[data-test="alert-type-danger"]`).should('exist', 1)
  })

  it('should not be able to edit an applied coupon', () => {
    cy.visit('/coupons')
    cy.get(`[data-test="${couponName}"]`).click()

    cy.get(`button[data-test="coupon-details-actions"]`).click()
    cy.get(`button[data-test="coupon-details-edit"]`).click()

    cy.get('input[name="name"]').should('not.be.disabled')
    cy.get('input[name="code"]').should('be.disabled')
    cy.get('[data-test="submit"]').should('be.disabled')
    cy.get('[data-test="checkbox-hasPlanOrBillableMetricLimit"] input').should('be.disabled')
    cy.get(`[data-test="delete-limited-plan-1"]`).should('not.exist')
  })
})
