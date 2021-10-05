/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('FilterGeopathAndOperatorSpecificIdForValidData', function () {
    const loginpage = new LoginPage()
    const workspacepage = new WorkspacePage();
    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('test_data').then(function (data) {
            this.data = data
        }),
            // before test
            cy.getCookies().should('have.length', 0)
        cy.clearCookies()
        cy.getCookies().should('be.empty')
        cy.intercept('https://intermx-test.apigee.net/', (req) => {
            req.headers['origin'] = 'https://gisdev.geopath.io'
        })
        cy.clearLocalStorage
        cy.visit("https://gisdev.geopath.io/?connection=Intermx")
        cy.wait(20000)
        cy.xpath("//*[contains(text(),'si')]").each(($e,index,$list) => {
                   const text = $e.text()
                 //  cy.log(text)    
                   if(text.includes("Please sign in below"))
                   {
                            loginpage.loginToStaging()    
                   }
               })   
    })

    /* === Test Created with Cypress Studio === */
    it('FilterGeopathAndOperatorSpecificIdForValidData', function () {
        cy.wait(20000)
        const explorePage = new ExplorePage()
        cy.wait(8000)
        explorePage.clickExploreButton()
        explorePage.clickOnFilterInventoryTab()
        explorePage.clickOnSpecificIdTab()
      //  explorePage.inputOperatorSpotId(82046)
        explorePage.clickApply()
        cy.get('.e2e-inventory-count').should('have.text', '720,592 Spots in filter ')
        //cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > [title="82046"]').should('have.text', 'Operator Spot ID: 82046')
        //cy.get(':nth-child(2) > .mat-card > .mat-card-content > .inventory-card > .address-container > [title="82046"]').should('have.text', 'Operator Spot ID: 82046')
        //cy.get(':nth-child(3) > .mat-card > .mat-card-content > .inventory-card > .address-container > [title="82046"]').should('have.text', 'Operator Spot ID: 82046')
       // cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)').should('have.text', 'Geopath Spot ID: 50280829')
        //cy.get(':nth-child(2) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)').should('have.text', 'Geopath Spot ID: 31023781')
        //cy.get(':nth-child(3) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)').should('have.text', 'Geopath Spot ID: 377249')
        //workspacepage.logout()
        cy.wait(10000)

    })
})