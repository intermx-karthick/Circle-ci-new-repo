/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import recordsManagementPage from '../../support/pageObjects/recordsManagementPage'


describe('InventoryPlan', function () {
    const loginpage = new LoginPage()

    const recordsmanagementPage = new recordsManagementPage();
    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('contract_test_data').then(function (data) {
            this.data = data
        }),
            // before test
            cy.getCookies().should('have.length', 0)
        cy.clearCookies()
        cy.getCookies().should('be.empty')
        cy.intercept('https://intermx-test.apigee.net/', (req) => {
            req.headers['origin'] = 'https://staging.oneomg.io'
        })
        cy.clearLocalStorage
        cy.visit("https://staging.oneomg.io/?connection=Intermx")
        cy.wait(20000)
        cy.xpath("//*[contains(text(),'si')]").each(($e,index,$list) => {
            const text = $e.text()
            cy.log(text)    
            if(text.includes("Please sign in below"))
            {
                     loginpage.loginToOneOmg()    
            }
        })   
    })

    /* === Test Created with Cypress Studio === */
    it('agencies', function () {
        cy.wait(20000)
        const agenciesName = recordsmanagementPage.generate_random_string_agencies(8)
        cy.wait(20000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        cy.wait(2000)
        recordsmanagementPage.clickOnAgencies()
        cy.wait(2000)
        recordsmanagementPage.clickOnAddAgencies()
        cy.wait(2000)
        recordsmanagementPage.createNewAgencies(agenciesName)
        cy.wait(20000)
        cy.get('.back-to-link').click()
        cy.wait(20000)
        cy.get('[formcontrolname="name"]').eq(1).click().type(agenciesName)
        cy.wait(2000)
        cy.get('.imx-button-primary > .mat-button-wrapper').eq(1).click()
        cy.wait(30000)
        cy.get('.primary-color-text').click()
        cy.wait(2000)
        cy.get('mat-select[formcontrolname="type"]').should('have.text','Media Agency')
        cy.get('mat-select[formcontrolname="division"]').should('have.text','Outdoor Media Group')
        cy.get('mat-select[formcontrolname="office"]').should('have.text','OMA Atlanta')

      /*  cy.get('div').within(() => {
            cy.get('input[formcontrolname="name"]').should('have.text', ' '+agenciesName+' ')
        })*/
        //click on back to agencies list
        cy.get('.back-to-link').click()
        //click on expand table
      recordsmanagementPage.clickOnExpandButton()
      cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .imx-link-cursor').should('have.text',' '+agenciesName)
        cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-type').should('have.text', 'Media Agency ')
        cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-division').should('have.text', ' Outdoor Media Group ')
        cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-phone').should('have.text', '987-654-3210')
        cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-state').should('have.text', ' NY ')
        cy.get('#agency-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-city').should('have.text', ' HOLTSVILLE ')

        cy.get('[fxflex="80"] > .mat-icon > svg').click()
        cy.wait(10000)
        recordsmanagementPage.deleteRecord()
     //   workspacepage.logout()
        cy.wait(10000)
    })
})