/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'

describe('VerifyshuffleColumnsInInventoryGrid', function () {
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

    it('CreateInventoryPlan', function () {
        //navigate to workspace
        cy.wait(20000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()


        const dataTransfer = new DataTransfer();0

        workspacepage.clickOnGenerateButton();
      //  cy.get('.caption').click()
        cy.wait(2000)
        cy.get('.primary-color-text').click();
        cy.wait(40000)
        //reset the columns before shuffling
        cy.get("mat-icon[svgicon='IMX-columns']>svg").click()
        //cy.xpath("//mat-icon[@svgicon='IMX-columns']").click()
        cy.wait(10000)
        //cy.get('.primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='RESET TO DEFAULT']").click()

 
        cy.wait(5000)
        cy.get('mat-header-row>mat-header-cell').eq(3).contains('Market')
       //cy.get('mat-header-row>mat-header-cell').eq(3).should('have.text', 'Market')
       //click on customize button
        //cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
        cy.get("mat-icon[svgicon='IMX-columns']>svg").click()
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
        cy.get('#list-block-2 > :nth-child(6) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(7) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(7) > div').click()
        cy.get('.primary-bg > .mat-button-wrapper').click()
        cy.wait(5000)
        //To verify the updated column position
        cy.get('mat-header-row>mat-header-cell').contains('Audience')
        //cy.xpath("//div[text()=' Audience ']").contains('Audience')
       // cy.get('mat-header-row>mat-header-cell').eq(7).contains('Target In-Market Frequency')
       cy.xpath("//div[text()=' Target In-Market Frequency ']").contains('Target In-Market Frequency')       
     //  workspacepage.logout()
        cy.wait(10000)
    })


})
