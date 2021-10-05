/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyMoveScenarioFromOneProjectToAnother', function () {
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
    it('VerifyMarketPlanGridValues', function () {
        //navigate to workspace
        cy.wait(20000)
        workspacepage.clickOnworkspace()
        cy.wait(10000)
        const campName = workspacepage.generate_random_string(8)
        const campName1 = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)
        workspacepage.clickOnGenerateButton()
        cy.wait(10000)
        workspacepage.generateInventoryPlanFromMarketPlan()
        workspacepage.moveMarketScenarioToSandbox()
        cy.get('.caption').click()

        cy.get('.mat-tab-label-content').contains('SANDBOX').click()
        cy.get(':nth-child(1) > .status-cell > .imx-ml-10 > [fxlayout="row"] > .primary-color-text').should('have.text', campName);

        //Verify move project from sandbox to a new project 
        cy.wait(200)
        cy.get('.mat-tab-label-content').contains('Projects').click()
        //click on add new project
        cy.get('.imx-project-action-button > .imx-button-stroked > .mat-button-wrapper').click()
        cy.get('#mat-input-52').click();
        cy.get('#mat-input-52').clear();
        cy.get('#mat-input-52').type(campName1);
        
        cy.get('#mat-input-53').click()
        cy.get('#mat-input-53').clear()
        cy.get('#mat-input-53').type(campName1)
        cy.get('.mat-dialog-actions > .imx-button-primary > .mat-button-wrapper').click();
      
      cy.get('.caption').click()
//again move to sandbox
        cy.get('.mat-tab-label-content').contains('SANDBOX').click()
        cy.wait(2000)
        workspacepage.moveScenarioToRequiredProject(campName1)
       
      //click on project
        cy.get('.mat-tab-label-content').contains('Projects').click()
        cy.get(':nth-child(1) > .status-cell > [fxlayout="row"] > .imx-ml-10').should('have.text', campName1);
        cy.get(':nth-child(1) > .status-cell > [fxlayout="row"] > .imx-ml-10').click()
        //Verify scenario is present in the moved project
        cy.get('.primary-color-text').should('have.text', campName);
      //  workspacepage.logout()
        cy.wait(10000)
    })
})