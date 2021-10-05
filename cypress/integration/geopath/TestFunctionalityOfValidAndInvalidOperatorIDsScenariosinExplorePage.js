/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('Test the functionality of Valid and Invalid Operators ID in ExplorePage', function () {
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
    it('Enter Valid and Invalid Operator ID, Apply and Validate, Invalid IDs Showin List and SortIDs and Close InvalidID Listpopup, Remove Invalid ID and Validate In Invalid IDs Count, Valid IDs Showin List and SortIDs and Close validID List popup, Validate Operator IDs In Spot Summay List page, Download As Pdf and Validating Inprogress PDF and Recently Completed', function () {
        cy.wait(10000)
        const explorePage = new ExplorePage()
        cy.wait(8000)
        explorePage.clickExploreButton()
        cy.wait(2000)
        explorePage.clickOnFilterInventoryTab()
        cy.wait(2000)
        explorePage.ClickOnSpecificIDSSubMenu()
        cy.wait(3000)
        explorePage.EnterValidOperatorsIDApplyandValidate(this.data.Valid_OperatorIDInExplore)
        cy.wait(2000)
        explorePage.ValidIDsShowinListandSortOperatorIDsandCloseVvalidIDListpopup()
        cy.wait(2000)
        explorePage.ValidateOperatorIDsInSpotSummayListpage()
        cy.wait(2000)
        explorePage.DownloadCSVandValidatingInprogressCSV()
        cy.wait(2000)
    })

})