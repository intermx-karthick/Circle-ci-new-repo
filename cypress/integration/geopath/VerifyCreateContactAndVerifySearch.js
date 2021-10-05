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
     it('contact', function () {
        cy.wait(20000)
        const contactName = recordsmanagementPage.generate_random_string_contact(8)
        cy.wait(20000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        cy.wait(2000)
        recordsmanagementPage.clickOnContact();
        cy.wait(2000)
        recordsmanagementPage.clickOnAddContact();
        cy.wait(2000)
        recordsmanagementPage.createNewContact(contactName);
        cy.wait(20000)
        cy.get('.back-to-link').click()
        cy.wait(20000)
        cy.get('[formcontrolname="name"]').eq(1).click().type(contactName)
        cy.wait(2000)
       // cy.get('[formcontrolname="name"]')
       // cy.wait(20000)
        cy.get('.imx-button-primary > .mat-button-wrapper').eq(1).click()
        cy.wait(20000)
        cy.get('.mat-row > .cdk-column-firstName').should('have.text', ' '+contactName+' ')
        cy.get('.mat-row > .cdk-column-lastName').should('have.text', ' contact ')
        cy.get('.mat-row > .cdk-column-companyName').should('have.text', '3.0 Outdoor')
        cy.get('.mat-row > .cdk-column-companyType').should('have.text', 'Vendor')
        cy.get('.mat-row > .cdk-column-email').should('have.text', 'mkrishnappa@intermx.com')
        cy.get('.mat-row > .cdk-column-mobile').should('have.text', '9876543210')
        cy.get('.mat-row > .cdk-column-state').should('have.text', ' NY ')
        cy.get('.mat-row > .cdk-column-city').should('have.text', ' HOLTSVILLE ')
        cy.wait(20000)
        cy.get('.cdk-column-firstName > .primary-color-text').click()
        cy.wait(2000)
        cy.get('mat-select[formcontrolname="type"]').should('have.text','Accounting/Billing')
         //click on back to agencies list
       cy.get('.back-to-link').click()
       //click on expand table
     recordsmanagementPage.clickOnExpandButton()
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-firstName').should('have.text', ' '+contactName+' ')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-lastName').should('have.text', ' contact ')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-companyName').should('have.text', '3.0 Outdoor')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-companyType').should('have.text', 'Vendor')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-email').should('have.text', 'mkrishnappa@intermx.com')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-mobile').should('have.text', '9876543210')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-state').should('have.text', ' NY ')
     cy.get('#contact-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-city').should('have.text', ' HOLTSVILLE ')

     cy.get('[fxflex="80"] > .mat-icon > svg').click()
     cy.wait(10000)
     recordsmanagementPage.deleteRecord()
    // workspacepage.logout()
        cy.wait(10000)
        })
    })
