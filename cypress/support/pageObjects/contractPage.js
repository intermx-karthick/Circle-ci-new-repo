class contractPage {

clickOnContractIcon() {
    cy.wait(2000);
    cy.get('[routerlink="/contracts-management"] > .mat-icon > svg').click();
  //  cy.get('.icon-align > img').click();
}

searchContractId(contractId) {
    cy.xpath("//mat-label[text()='Search Contract ID #']//parent::label//parent::span//parent::div//input").type(contractId);
}

clickOnSearchButton() {
    cy.wait(200)
    cy.xpath("//span[text()='SEARCH']").click();
}

clickOnFirstRowInContract() {
    cy.get('[class="primary-color-text font-weight-normal vendor-name-td imx-name-wrap"]').click()
}

clickOnLineItemId() {
    cy.wait(200)
    cy.get('.table-link').eq(0).click()
}

selectPeriodLength(period) {
    cy.get('[formcontrolname="periodLength"]').click()
    cy.get('span').contains(period).click()
}
}

export default contractPage;