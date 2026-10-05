const foundation = '[aria-label="Color foundation"]'
const preview = `${foundation} > [data-color-theme]`

const visitColors = (): void => {
  cy.intercept('GET', '**/env-config.js', (req) => {
    req.continue((res) => {
      res.body = `${res.body}\nwindow.APP_ENV = "qa";`
    })
  })
  cy.login()
  cy.visitApp('/design-system/shadcn')
}

describe('Shadcn color foundation', () => {
  it('loads the color tables and switches their local theme', () => {
    visitColors()
    cy.get(`${foundation} [data-color-primitive]`).should('have.length', 76)
    cy.get(`${foundation} [data-color-semantic]`).should('have.length', 47)
    cy.get(preview).should('have.css', 'background-color', 'rgb(255, 255, 255)')
    cy.get(`${foundation} [data-color-semantic="selected"] td div`).should(
      'have.css',
      'background-color',
      'rgba(0, 0, 0, 0.08)',
    )
    cy.get(foundation)
      .contains('button', /^Dark$/)
      .click()
    cy.get(preview).should('have.css', 'background-color', 'rgb(26, 26, 26)')
    cy.get(`${foundation} [data-color-semantic="selected"] td div`).should(
      'have.css',
      'background-color',
      'rgba(255, 255, 255, 0.1)',
    )
    cy.get(foundation)
      .contains('button', /^Light$/)
      .click()
    cy.get(preview).should('have.css', 'background-color', 'rgb(255, 255, 255)')
    cy.get(`${foundation} [data-color-semantic="selected"] td div`).should(
      'have.css',
      'background-color',
      'rgba(0, 0, 0, 0.08)',
    )
  })
})
