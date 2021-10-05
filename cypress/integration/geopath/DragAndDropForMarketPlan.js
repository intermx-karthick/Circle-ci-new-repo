/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyDragAndDropForMarketPlan', function () {
   
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
    it('MarketPlanCreationWithTwoAudience', function () {
        //navigate to workspace
        cy.wait(10000)
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
        cy.wait(20000)


        //click on customize button
        workspacepage.clickOnCustomizeColumns()
        //reset the columns before shuffling
        cy.get('.primary > .mat-button-wrapper').click()
        cy.wait(2000)
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        cy.get('#list-block-2 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(2) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(2) > div').click()

        cy.get('#list-block-2 > :nth-child(9) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(10) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(10) > div').click()

        cy.get('.primary-bg > .mat-button-wrapper').click()

        //To verify the updated column position
        cy.get('mat-header-row>mat-header-cell').eq(2).contains('Audience')
        //    cy.get('mat-header-row>mat-header-cell').eq(9).contains('Total Imp.')
        //    cy.get('mat-header-row>mat-header-cell').eq(10).contains('Target Imp.')

        workspacepage.clickOnExpandIconInInventoryPlan();
        workspacepage.clickOnCollapseTableInInventoryPlan();
        // cy.get('mat-sort-header mat-header-cell').eq(11).contains('Audience')

        //click on customize button and reset the changes
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        cy.get('.footer > [fxlayout="row"] > .primary').click()
        cy.wait(5000)
        //To verify the updated column position after reset
        cy.get('mat-header-row>mat-header-cell').eq(2).contains('Audience')
      //  workspacepage.logout()
        cy.wait(10000)
    })
})