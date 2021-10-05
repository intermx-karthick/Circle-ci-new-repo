/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('Test the Functionality Of Save As New Inventory Set and generate plan and Validate', function () {
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
    it('Test the Functionality Of Save As New Inventory Set and generate plan and Validate', function () {
        cy.wait(10000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("step 2: Redirects to the workspace")
        cy.log("step 3: Click 'Add Project' to create an new project")
        cy.log("step 4: Click 'Add Plan' and select the 'Inventory Plan' tab")
        cy.log("step 5: In Inventory click attributes and select murals and apply it")
        cy.log("step 6: Then validate Inventory media types and thresholds on Summay list and Generate the plan")
        cy.log("step 7: Selects generated scenario name and save as inventory set")
        cy.log("step 8: Saved inventory set validate in the Inventory set popup")
        cy.log("step 9: Selects the newly saved inventory set and generate the plan and validate the values with existing scenario values")

        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

      workspacepage.createNewProject(campName)
      cy.wait(4000)
      cy.get('.text-tooltip').should('have.text', campName);

      cy.wait(3000)
      workspacepage.clickOnAddPlan()

      cy.wait(3000)
      workspacepage.clickOnInventoryPlan()

      cy.wait(3000)
      workspacepage.SelectInventoryandClickAttributesandSelectsMurals()

      cy.wait(3000)
      workspacepage.ValidateInventoryMediatypesandThresholdsandGenerate()

      cy.wait(40000)
      workspacepage.ClickGeneratedScenarioNameandSaveAsInventorySet(campName)

      workspacepage.SavedInventorySetvalidateintheInventorySetpopup(campName)
      
      workspacepage.ApplyNewlySaveInventorySetandGeneratePlan(campName)

      workspacepage.ValidateNewlySavedInventorySetValueswithExistingScenarioValues()
    })
})