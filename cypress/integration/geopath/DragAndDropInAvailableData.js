/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'

describe('VerifyDragAndDropInAvailableData', function () {
    
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
        workspacepage.clickOnworkspace()
        cy.wait(10000)
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()


        const dataTransfer = new DataTransfer();

        workspacepage.clickOnGenerateButton();
        cy.get('.primary-color-text').click();
        cy.wait(5000)
        cy.get('mat-header-row>mat-header-cell').eq(3).contains('Market')
        //cy.get('mat-header-row>mat-header-cell').eq(3).should('have.text', 'Market')
        //click on customize button
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        //reset the columns before shuffling
        cy.get('.primary > .mat-button-wrapper').click()
        cy.wait(2000)
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        //verify the data before drg and drop
        cy.get('#list-block-1 > :nth-child(1) > div').should('contain.text', ' Target In-Market Frequency ')
        cy.get('#list-block-1 > :nth-child(2) > div').should('contain.text', ' Total In-Market Impressions ')

        //verify drag and drop in available data
        cy.get('#list-block-1 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(2) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(2) > div').click()
        //verify the data after drag and drop
        cy.get('#list-block-1 > :nth-child(1) > div').should('contain.text', ' Target In-Market Frequency ')
        cy.get('#list-block-1 > :nth-child(2) > div').should('contain.text', ' Total In-Market Impressions ')
       // workspacepage.logout()
        cy.wait(10000)
    })
})