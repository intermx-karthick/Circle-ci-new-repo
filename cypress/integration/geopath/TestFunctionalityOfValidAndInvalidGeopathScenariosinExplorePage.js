/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('Test the functionality of Valid and Invalid Geopath ID in ExplorePage', function () {
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
    it('Enter Valid and Invalid Geopath ID, Apply and Validate, Invalid IDs Showin List and SortIDs and Close InvalidID Listpopup, Remove Invalid ID andValidate In Invalid IDs Count, Valid IDs Showin List and SortIDs and Close validID List popup, Validate Geopath IDs In Spot Summay List page, Download As Pdf and Validating Inprogress PDF and Recently Completed', function () {
        cy.wait(10000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("Step 2: Redirects to the Explore")
        cy.log("Step 3: Click on Filter Inventory sub menu")
        cy.log("Step 4: Click on Filter Inventory sub menu and Selects Specific IDs")
        cy.log("Step 5: Enter Valid and Invalid Geopath Spot ID then apply and Valiate it")
        cy.log("Step 6: View Invalid IDs show in list and sort IDs then close the Invalid IDs popup")
        cy.log("Step 7: Remove the Invalid ID and Validate in Invalid IDs count")
        cy.log("Step 8: View Vvalid IDs show in list and sort IDs then close the Valid IDs popup")
        cy.log("Step 9: Validate all the Geopath IDs in Spots Summary List page")
        cy.log("Step 10: Select Download As PDF in the Select dropdown and validate in the Notification popup and open the PDF in the new tab")

        const explorePage = new ExplorePage()
        cy.wait(8000)
        explorePage.clickExploreButton()
        cy.wait(2000)
        explorePage.clickOnFilterInventoryTab()
        cy.wait(2000)
        explorePage.ClickOnSpecificIDSSubMenu()
        cy.wait(3000)
        explorePage.EnterValidandInvalidGeopathSpotIDApplyandValidate(this.data.ValidAndInvalid_GeopathIDInExplore)
        cy.wait(4000)   
        explorePage.InvalidIDsShowinListandSortIDsandCloseInvalidIDListpopup()
        cy.wait(2000)
        explorePage.RemoveInvalidIDandValidateInInvalidIDsCount()
        cy.wait(2000)
        explorePage.ValidIDsShowinListandSortIDsandCloseVvalidIDListpopup()
        cy.wait(2000)
        explorePage.ValidateGeopathIDsInSpotSummayListpage()
        cy.wait(2000)
        explorePage.DownloadAsPdfandValidatingInprogressPDFandRecentlyCompletedandOpenPDFinNewtab()
        cy.wait(2000)
    })
})