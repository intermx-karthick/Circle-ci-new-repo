/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'
import { isThisISOWeek } from 'date-fns'


describe('VerifyMessageOfGeneratingInventoryPlan', function () {
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
    it('MarketInventoryPlanCreation', function () {
        //navigate to workspace
        cy.wait(10000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.wait(4000)
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
        cy.wait(8000)
        workspacepage.clickOnNotificationButton()
        cy.wait(4000)
        cy.get(':nth-child(4) > .job-status').should('contain.text', (this.data.In_Progress));
        cy.wait(4000)
      //  workspacepage.clickOnNotificationButton()
     // cy.get('svg > .ng-star-inserted').click()
    //     workspacepage.clickOnFirstInventoryPlanInNotification()
    //     cy.wait(15000)
    //     cy.get('.plan-in-progress').should('contain.text', (this.data.Inventory_Message));

        
    //   //  workspacepage.clickOnCancelNotificationButton()
    //   cy.wait(35000)
    //   cy.get('.caption').click()
    //   cy.get('[class = "total-record"]').should('contain.text', (this.data.Total_Count));
        

    //     workspacepage.clickOnTypeFilter()
    //     cy.get('[class = "total-record"]').should('contain.text', (this.data.Found_1));
    //workspacepage.logout()
    cy.wait(10000)
    });
})