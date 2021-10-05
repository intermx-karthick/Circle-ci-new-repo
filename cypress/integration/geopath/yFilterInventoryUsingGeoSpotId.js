/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
describe('VerifyFilterInventoryUsingGeoSpotId', function () {
    const loginpage = new LoginPage()

    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('explore_test_data').then(function (data) {
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
    it('exploreUsecase1', function () {
        cy.wait(20000)
        //const loginpage = new LoginPage()
        const explorePage = new ExplorePage()
        //cy.get("input[type='email']").type(this.data.username)
        //homepage.enterUserName(this.data.username)
        //loginpage.loginAppication()
        explorePage.clickExploreButton()
        explorePage.clickOnFilterInventoryTab()
        explorePage.clickOnSpecificIdTab()
        explorePage.inputGeopathSpotId(this.data.GeopathSpotId)
        explorePage.clickApply()


        cy.wait(10000)
        cy.get('div').contains('Geopath Spot ID: 30874080').should('have.text', this.data.geopath)
        cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)')
            .should('have.text', this.data.geopath);
           // workspacepage.logout()
            cy.wait(10000)
    })


})