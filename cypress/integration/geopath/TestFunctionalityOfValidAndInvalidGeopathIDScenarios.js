/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'

describe('TestFunctionalityOfValidAndInvalidGeopathIDScenarios', function () {  
    const loginpage = new LoginPage()
    const workspacepage = new WorkspacePage();
    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('test_data').then(function (data) {
            this.data = data
        }),       // before test
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

    it('1. Test the functionality Submit Valid and Invalid Geopat Spot Ids on Inventory Plan popup and Validate', function () {
        cy.wait(5000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("Step 2: Redirects to the workspace")
        cy.log("Step 3: Click 'Add Project' to create an new project")
        cy.log("Step 4: Click 'Add Plan' and selects the 'Inventory Plan' tab")
        cy.log("Step 5: Submit the valid 15 Geopath Spot Id and Validate in the Summary page")
        cy.log("Step 6: Again Reopen the Inventory Plan popup and Submit the 10 Invalid and 5 valid Geopath Ids and Validate the Invalid ID validation")
        cy.log("Step 7: Remove the Invalid IDs and Apply with the Valid Geopath IDs")
        cy.log("Step 8: Then Validate total of geopath ids in the Summary page")
        cy.log("Step 9: Generate the Inventory Plan")
        cy.log("Step 10: Valid the Generating text and By default generated scenario name validate on Footer Notification and Notification on Inprogress Section")
        cy.log("Step 11: Validate Total count on the Recently Completed on Notification popup and Redirects to the Inventory Plan page")

        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.wait(4000)
        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()
        workspacepage.Submit15ValidGeopathIDandValidateInSummary(this.data.Valid_GeopathID)
        workspacepage.Submit10Invalidand5ValidGeopathIDandValidateInSummary(this.data.InvalidandValid_GeoPathID)
        workspacepage.RemoveInvalidGeopathIdAndApplywithValidIdandValidateInSummary()
        workspacepage.GenerateInventoryPlanAndValidateUnitScenarioNameinNotificationandredirectsToInventoryPlan()
        })

})
