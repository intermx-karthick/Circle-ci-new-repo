/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyGenerateInventoryPlanFromMarketPlan', function () {
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
    it('CreateMarketAndInventoryPlan', function () {
        //navigate to workspace
        cy.wait(10000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("step 2: Redirects to the workspace")
        cy.log("step 3: Click 'Add Project' to create an new project")
        cy.log("step 4: Validate the created project title")
        cy.log("step 5: Click 'Add Plan' and select the 'Inventory Plan' tab")
        cy.log("step 6: Create 'Audience', 'Market', 'Operators' and 'Media' on Market Plan page")
        cy.log("step 7: Create Scenario Name and Scenario Description and click the generate button")
        cy.log("step 8: Validate the Total should be 1 in the Market Plan page")
        cy.log("step 9: Go back to the Plan page and select as 'Generate Inventory Plan' page")
        cy.log("step 10: After generate inventory plan, verify the Total. It should be 2 in the Plan page")

        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        //cy.get('div.ng-star-inserted > div > .cursor-link > .mat-icon').trigger('mouseover').should('have.text', campName);
        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)
        workspacepage.clickOnGenerateButton()
        cy.wait(200);
        cy.get('.total-record').should('contain.text', (this.data.Total_Count_1));
        workspacepage.generateInventoryPlanFromMarketPlan()
        cy.get('.total-record').should('contain.text', (this.data.Total_Count));
      //  workspacepage.logout()
        cy.wait(10000)
    });
})