describe('TRAKKNAME', () => {
  it('Shows the generator', () => {
    cy.visit('/')
    cy.contains('ion-title', 'TRAKKNAME')
    cy.contains('ion-button', 'GENERATE')
  })
})
