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
          //  cy.log(text)    
            if(text.includes("Please sign in below"))
            {
                     loginpage.loginToOneOmg()    
            }
        })   
    })

    /* === Test Created with Cypress Studio === */
    it('client', function () {
        cy.wait(10000)
        const clientName = recordsmanagementPage.generate_random_string_client(8)
        cy.wait(10000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        cy.wait(2000)
        recordsmanagementPage.clickOnClient()
        cy.wait(2000)
        recordsmanagementPage.clickOnAddClient()
        cy.wait(2000)
        recordsmanagementPage.createNewClient(clientName)
        cy.wait(20000)
        cy.get('.back-to-link').click()
        cy.wait(20000)
        cy.get('[formcontrolname="name"]').eq(1).click().type(clientName)
        cy.wait(2000)
        //cy.get('[formcontrolname="name"]')
        //cy.wait(2000)
        //cy.get('.imx-button-primary > .mat-button-wrapper').eq(1).click()
        cy.xpath("//span[text()='Search']").click()
        cy.wait(5000)
        cy.get('.mat-row > .cdk-column-mediaAgency-name').should('have.text', 'Acento')
        cy.get('.mat-row > .cdk-column-office-name').should('have.text', 'OMA Atlanta')
        //cy.get('.mat-row > .cdk-column-managedBy-name').should('have.text', 'intermx-support-user@intermx.com')
        cy.wait(2000)
        cy.get('.primary-color-text').click({ multiple: true })
        cy.wait(2000)
        cy.get('mat-select[formcontrolname="clientType"]').should('have.text', 'OMD')
        cy.get('mat-select[formcontrolname="division"]').should('have.text', 'Outdoor Media Group')
        cy.get('mat-select[formcontrolname="office"]').should('have.text', 'OMA Atlanta')
      //  cy.get('mat-select[formcontrolname="agencyContact"]').should('have.text', 'max well')
        //cy.get('mat-select[formcontrolname="creativeAgencyContact"]').should('have.text', 'Select Creative Agency Contact')
      //  cy.get('#mat-input-67').should('have.text', clientName)

       //click on back to agencies list
       cy.get('.back-to-link').click()
        //click on expand table
      recordsmanagementPage.clickOnExpandButton()
      cy.get('#client-fullscreen-scroll > .mat-table > .mat-row > .imx-link-cursor').should('have.text', ' '+clientName+' ')
      cy.wait(3000)
      cy.get('#client-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-mediaAgency-name').should('have.text', 'Acento')
      cy.get('#client-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-office-name').should('have.text','OMA Atlanta')
      cy.wait(5000)
    //  cy.get('.mat-table > .mat-row > .cdk-column-managedBy-name').eq(1).should('have.text', 'intermx-support-user@intermx.com')
      cy.get('[fxflex="80"] > .mat-icon > svg').click()
        cy.wait(10000)
        recordsmanagementPage.deleteRecord()
       // workspacepage.logout()
        cy.wait(10000)
    })
})