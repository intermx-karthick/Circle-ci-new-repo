/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('CreateMarketAndInventoryPlan', function () {

   
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
            
            //return flase
    })
    /* === Test Created with Cypress Studio === */
    it('CreateMarketAndInventoryPlan', function () {
        //navigate to workspace
        console.log("Step 1: Login in to the geopath staging site.")
        console.log("step 2: Redirects to the workspace.")
        console.log("step 3: Click 'Add Project' to create an new project.")
        console.log("step 4: Validate the created project title.")
        console.log("step 5: Click 'Add Plan' and select the 'Market Plan' tab.")
        console.log("step 6: Create 'Audience', 'Market', 'Operators' and 'Inventory' on Market Plan page.")
        console.log("step 7: Create Scenario Name and Scenario Description and click the generate button.")
        console.log("step 8: Click 'Actions' and selects 'Generate Inventory Plan' in the Market Plan page.")
        console.log("step 9: Back to the Projects page and delete the recently created project and validate the deleted message.")


        cy.wait(10000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)
        
        workspacepage.createNewProject(campName)
        cy.wait(5000)
        cy.get('.text-tooltip').should('have.text', campName);

        //cy.get('div.ng-star-inserted > div > .cursor-link > .mat-icon').trigger('mouseover').should('have.text', campName);
        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)    
        workspacepage.clickOnGenerateButton()
        workspacepage.clickOnActionButton()
        workspacepage.selectGenerateInventoryPlan()
        workspacepage.deleteCreatedProject(campName)
       // workspacepage.logout()
        cy.wait(10000)
    });

    
})