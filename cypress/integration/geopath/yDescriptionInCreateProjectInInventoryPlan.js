/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyDescriptionInCreateProjectInInventoryPlan', function () {
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
    it('CreateInventoryPlan', function () {
        //navigate to workspace
        cy.wait(20000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);
           cy.get('.cursor-link > .mat-icon').rightclick()
        cy.get('.ng-tooltip > span').should('have.text', "Description: "+campName).wait(2000)


        workspacepage.clickOnAddPlan()

        workspacepage.clickOnInventoryPlan()

        workspacepage.selectAudience(this.data.persons_5plus);

        workspacepage.selectMarketForInventoryPlan(this.data.new_york)

        workspacepage.selectOperator(this.data.lamar)

        workspacepage.selectInventory(this.data.New_York_Murals)

        workspacepage.typeInventoryScenarioName(campName)

        workspacepage.clickOnGenerateButton()
        cy.wait(20000)
        cy.get('.cursor-link > .mat-icon').rightclick()
        cy.get('span').contains("Description: "+campName)
        cy.get('.ng-tooltip').should('have.text', "Description: "+campName).wait(2000)
       // workspacepage.logout()
        cy.wait(10000)
     });
})