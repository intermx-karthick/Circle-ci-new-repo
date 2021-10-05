/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
describe('VerifyExlporeFunctionality', function () {
    const loginpage = new LoginPage()

    before(function () {
        cy.wait(5000)
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
    it('exploreUsecase1', function () {
        cy.wait(20000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("Step 2: Redirects to the explore page")
        cy.log("Step 3: Click 'Define Target' in the available menu")
        cy.log("Step 4: Selects 'Select Audience' in the sub menu and Enter Persons 5+ years in the Search Field and selects and Apply it")
        cy.log("Step 5: Selects 'Assign Market' in the sub menu and Select as 'National and United States' and add as individual")
        cy.log("Step 6: Selects as yes in the 'Would you like to use this market selection to filter inventory' popup")

        //const loginpage = new LoginPage()
        const explorePage = new ExplorePage()
        //cy.get("input[type='email']").type(this.data.username)
        //homepage.enterUserName(this.data.username)
        //loginpage.loginAppication()
        cy.wait(8000)
        explorePage.clickExploreButton()
        cy.wait(10000)
        explorePage.clickOnDefineTargetTab()
        explorePage.selectAudience(this.data.persons_5plus);
        explorePage.assignMarket(this.data.new_york);

        // cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)')
        //     .should('have.text', this.data.geopath);
        //workspacepage.logout()
cy.wait(10000)

    });
})