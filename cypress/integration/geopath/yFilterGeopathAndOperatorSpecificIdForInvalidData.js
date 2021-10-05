/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('FilterGeopathAndOperatorSpecificIdForInvalidData', function () {
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
    it('FilterGeopathAndOperatorSpecificIdForInvalidData', function () {
        cy.wait(20000)
        const explorePage = new ExplorePage()
        cy.wait(8000)
        explorePage.clickExploreButton()
        explorePage.clickOnFilterInventoryTab()
        explorePage.clickOnSpecificIdTab()
        explorePage.inputGeopathSpotId(0)
        explorePage.clickApply()
        cy.wait(8000)
        //verify no spots to display for geopath when invalid data is provided in filters
        cy.get('.subtitle-1 > .ng-star-inserted').should('have.text', ' No Spots to display. Please try with different filters. ')
     //   explorePage.clearSpotId()
       // explorePage.inputOperatorSpotId(0)
        explorePage.clickApply()
        cy.wait(8000)
        //verify no spots to display for operator when invalid data is provided in filters
        cy.get('.subtitle-1 > .ng-star-inserted').should('have.text', ' No Spots to display. Please try with different filters. ')
        //explorePage.clearSpotId() 
        explorePage.clickApply()
        //verify error message when there are no filters applied and user clicks on apply
      //  cy.get('#swal2-content').should('have.text', 'No valid IDs detected. Please enter valid IDs to search.')
      //  workspacepage.logout()
        cy.wait(10000)
    })
})
