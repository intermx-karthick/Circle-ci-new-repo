/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'

describe('VerifyColumnAreDefualtedOnReset', function () {
  
    const loginpage = new LoginPage()

    const workspacepage = new WorkspacePage();
    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('test_data').then(function (data) {
            this.data = data
        }),            // before test
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

    it('CreateInventoryPlan', function () {
        //navigate to workspace

        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("step 2: Redirects to the workspace")
        cy.log("step 3: Click 'Add Project' to create an new project")
        cy.log("step 4: Validate the created project title")
        cy.log("step 5: Click 'Add Plan' and select the 'Inventory Plan' tab")
        cy.log("step 6: By default 'Audience' and 'Markets' data available, So selects 'Generate' button")
        cy.log("step 7: Selects the newly created scenario after complete the generate In Add Plan page")
        cy.log("step 8: Validate 3rd column contains the 'Market'")
        cy.log("step 9: Reset to Default Column in the 'Customize Columns' popup")
        cy.log("step 10: Again Reopen the 'Customize Column' popup and swap the 'Audience and Plan name' and add 'Target In-market frequency' into the 'Columns in currentview' and validate all those in the Inventory Plan page")
        cy.log("step 11: Then again 'Reset to Default' Column in the 'Customize Columns' popup")

        cy.wait(10000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.wait(4000)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()


        const dataTransfer = new DataTransfer();

        workspacepage.clickOnGenerateButton();
        cy.get('.primary-color-text').click();
        cy.wait(20000)
        cy.get('mat-header-row>mat-header-cell').eq(3).contains('Market')
        //cy.get('mat-header-row>mat-header-cell').eq(3).should('have.text', 'Market')

        //reset the columns before shuffling
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
cy.get('.primary > .mat-button-wrapper').click()
cy.wait(2000)

        //click on customize button
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        //moving plan name to the second position in current view
        cy.get('#list-block-2 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(2) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(2) > div').click()
        //moving target in-Market Frquency to second last position in current view
        cy.get('#list-block-1 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(6) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(6) > div').click()
        cy.wait(3000)
        //moving target in-Market Frquency to second last position in current view
        // cy.get('#list-block-2 > :nth-child(6) > div').trigger('mousedown', { button: 0 })
        // cy.get('#list-block-2 > :nth-child(7) > div').trigger('mousemove', { button: 1 })
        // cy.get('#list-block-2 > :nth-child(7) > div').click()
        cy.get('.primary-bg > .mat-button-wrapper').click()
        cy.wait(5000)
   //To verify the updated column position
   cy.get('mat-header-row>mat-header-cell').eq(1).contains('Audience')
   cy.get('mat-header-row>mat-header-cell').eq(6).contains('Target In-Market Frequency')

    //click on customize button
    cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
   cy.get('.footer > [fxlayout="row"] > .primary').click()
   cy.wait(5000)
   //To verify the reset column position
   cy.get('mat-header-row>mat-header-cell').eq(1).contains('Plan Name')
   cy.get('mat-header-row>mat-header-cell').eq(2).contains('Audience')
   cy.get('mat-header-row>mat-header-cell').eq(7).should('not.contain', 'Target In-Market Frequency')
    //workspacepage.logout()
   cy.wait(10000)
    })
})
