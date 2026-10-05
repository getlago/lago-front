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
  it('loads all tokens, switches locally, and propagates nested/portal modes', () => {
    visitColors()
    cy.get(`${foundation} [data-color-primitive]`).should('have.length', 77)
    cy.get(`${foundation} [data-color-semantic]`).should('have.length', 47)
    cy.get(preview).should('have.css', 'background-color', 'rgb(255, 255, 255)')
    cy.get(`${foundation} [data-variant="default"]`)
      .first()
      .should('have.css', 'background-color', 'rgb(3, 105, 204)')
    cy.get(`${foundation} [data-variant="secondary"]`)
      .first()
      .should('have.css', 'background-color', 'rgb(236, 236, 236)')
    cy.get('[aria-label="Legacy color reference"]').then(($legacy) => {
      const before = ['color', 'background-color', 'border-color'].map((property) =>
        $legacy.css(property),
      )

      cy.get(foundation)
        .contains('button', /^Dark$/)
        .click()
      cy.get(preview).should('have.css', 'background-color', 'rgb(26, 26, 26)')
      cy.get(`${foundation} [data-variant="secondary"]`)
        .first()
        .should('have.css', 'background-color', 'rgb(35, 35, 35)')
      cy.get(`${foundation} [data-color-semantic="selected"] td div`).should(
        'have.css',
        'background-color',
        'rgba(255, 255, 255, 0.1)',
      )
      cy.get('[aria-label="Nested opposite theme"]').should(
        'have.css',
        'background-color',
        'rgb(255, 255, 255)',
      )
      cy.get(foundation).contains('button', 'Open portal preview').click()
      cy.get('[aria-label="Portalled color preview"]')
        .should('have.attr', 'data-color-theme', 'dark')
        .and('have.css', 'background-color', 'rgb(35, 35, 35)')
      cy.contains('button', 'Close portal preview').click()
      cy.get('[aria-label="Legacy color reference"]').should(($after) => {
        expect(
          ['color', 'background-color', 'border-color'].map((property) => $after.css(property)),
        ).to.deep.equal(before)
      })
    })
    cy.get('[aria-label="Disabled color input"]')
      .should('be.disabled')
      .and('have.css', 'background-color', 'rgb(33, 33, 33)')
    cy.get('[aria-label="Invalid color input"]')
      .focus()
      .should('have.css', 'border-color', 'rgb(248, 113, 113)')
    cy.get(foundation)
      .contains('button', /^Light$/)
      .click()
    cy.get('[aria-label="Invalid color input"]')
      .focus()
      .should('have.css', 'border-color', 'rgb(185, 28, 28)')
  })
})

const pointAt = (selector: string, type: string): void => {
  cy.get(selector)
    .first()
    .scrollIntoView()
    .then(($element) => {
      const element = $element[0]
      const rect = element.getBoundingClientRect()
      const win = element.ownerDocument.defaultView!
      const frame = window.top!.document.querySelector('iframe.aut-iframe') as HTMLElement
      const frameRect = frame?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
        width: win.innerWidth,
        height: win.innerHeight,
      }
      const scaleX = frame ? frameRect.width / frame.offsetWidth : 1
      const scaleY = frame ? frameRect.height / frame.offsetHeight : 1
      const x = frameRect.left + (rect.left + rect.width / 2) * scaleX
      const y = frameRect.top + (rect.top + rect.height / 2) * scaleY

      return Cypress.automation('remote:debugger:protocol', {
        command: 'Input.dispatchMouseEvent',
        params: {
          type,
          x,
          y,
          button: type === 'mouseMoved' ? 'none' : 'left',
          buttons: type === 'mousePressed' ? 1 : 0,
          clickCount: type === 'mouseMoved' ? 0 : 1,
        },
      })
    })
}

it('uses real pointer hover and pressed colors without stacking alpha layers', () => {
  visitColors()
  const primary = `${foundation} [data-variant="default"]:not(:disabled)`
  pointAt(primary, 'mouseMoved')
  cy.get(primary).should('have.css', 'background-color', 'rgb(2, 89, 173)')
  pointAt(primary, 'mousePressed')
  cy.get(primary).should('have.css', 'background-color', 'rgb(2, 73, 143)')
  pointAt(primary, 'mouseReleased')
  const secondary = `${foundation} button[data-variant="secondary"]:not(:disabled)`
  pointAt(secondary, 'mouseMoved')
  cy.get(secondary).should(
    'have.css',
    'background-image',
    'linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.04))',
  )
  pointAt(secondary, 'mousePressed')
  cy.get(secondary).should(
    'have.css',
    'background-image',
    'linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08))',
  )
  cy.get(secondary).should('have.css', 'background-color', 'rgb(236, 236, 236)')
  pointAt(secondary, 'mouseReleased')
  cy.get(foundation)
    .contains('button', /^Dark$/)
    .click()
  pointAt(secondary, 'mouseMoved')
  cy.get(secondary).should(
    'have.css',
    'background-image',
    'linear-gradient(rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.06))',
  )
  pointAt(secondary, 'mousePressed')
  cy.get(secondary).should(
    'have.css',
    'background-image',
    'linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))',
  )
  pointAt(secondary, 'mouseReleased')
  cy.get('[aria-label="Default color input"]')
    .focus()
    .should('have.css', 'border-color', 'rgb(143, 196, 255)')
})
