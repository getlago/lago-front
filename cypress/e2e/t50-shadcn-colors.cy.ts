const preview = 'section[aria-label="V2 colors"] > .v2-theme'
const legacyControl = 'button.MuiButton-root:first'

describe('Shadcn color foundation', () => {
  it('loads real styles, themes portal content, and keeps legacy controls isolated', () => {
    // Enable the existing QA-only showcase in this browser, including in the CI build.
    cy.intercept('GET', '**/env-config.js*', (req) => {
      req.continue((res) => {
        // Vite returns the HTML fallback when no runtime config file exists locally.
        const config = String(res.body).trimStart().startsWith('<') ? '' : res.body

        res.statusCode = 200
        res.headers['content-type'] = 'application/javascript'
        res.body = `${config}\nwindow.APP_ENV = 'qa';`
      })
    })
    cy.login()
    cy.get(legacyControl).then(($control) => {
      const style = getComputedStyle($control[0])
      const original = {
        background: style.backgroundColor,
        color: style.color,
        border: style.borderColor,
      }

      cy.visitApp('/design-system/shadcn')
      cy.get(preview).should('have.css', 'background-color', 'rgb(255, 255, 255)')
      cy.contains('button', 'Standalone button').should(
        'have.css',
        'background-color',
        'rgb(0, 108, 250)',
      )
      cy.get('input[aria-label="Standalone input"]')
        .should('have.class', 'v2-input')
        .and('have.css', 'background-color', 'rgb(255, 255, 255)')
      cy.get('#v2-customer').focus().should('have.css', 'outline-color', 'rgb(0, 108, 250)')
      cy.get('#v2-account')
        .should('be.disabled')
        .and('have.css', 'background-color', 'rgb(236, 236, 238)')
      cy.get('#v2-email').should('have.css', 'border-color', 'rgb(185, 28, 28)')

      cy.contains('button', 'Switch to dark').click()
      cy.get(preview).should('have.css', 'background-color', 'rgb(24, 24, 26)')
      cy.get('#v2-customer').should('have.css', 'background-color', 'rgb(24, 24, 26)')
      cy.contains('button', 'Standalone button').should('have.attr', 'data-theme', 'light')
      cy.get(legacyControl)
        .should('not.have.class', 'v2-theme')
        .and('have.css', 'background-color', original.background)
        .and('have.css', 'color', original.color)
        .and('have.css', 'border-color', original.border)

      cy.get(preview).contains('button', 'Send invoice').click()
      cy.get('body > .v2-theme > dialog[open]')
        .should('be.visible')
        .and('have.css', 'background-color', 'rgb(24, 24, 26)')
        .contains('button', 'Cancel')
        .click()
      cy.get('dialog[open]').should('not.exist')
      cy.contains('button', 'Switch to light').click()
      cy.get(preview).should('have.css', 'background-color', 'rgb(255, 255, 255)')
    })
  })
})
