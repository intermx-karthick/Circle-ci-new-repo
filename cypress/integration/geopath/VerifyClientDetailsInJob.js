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
        cy.wait(20000)
        const clientName = recordsmanagementPage.generate_random_string_client(8)
        const jobName = recordsmanagementPage.generate_random_string_Job(8)
        cy.wait(2000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        cy.wait(2000)
        recordsmanagementPage.clickOnClient()
        cy.wait(2000)
        recordsmanagementPage.clickOnAddClient()
        cy.wait(2000)
        recordsmanagementPage.createNewClient(clientName)
        cy.wait(20000)
        cy.get('.back-to-link').click()
        cy.wait(2000)
       // cy.get('[formcontrolname="name"]').click()
      //  cy.wait(2000)
      //  cy.get('[formcontrolname="name"]').type(clientName)
      //  cy.wait(2000)
      //  cy.get('.imx-button-primary > .mat-button-wrapper').click()
     //   cy.wait(2000)
   //  cy.get('.mobile-hide.menu-enabled').click()
    // cy.get('mat-icon[svgicon="IMX-jobs"]').click({force: true})

    cy.wait(20000)
    cy.get('[formcontrolname="name"]').eq(1).click().type(clientName)
   // cy.wait(2000)
    //cy.get('[formcontrolname="name"]')
      cy.wait(2000)
        cy.get('.imx-button-primary > .mat-button-wrapper').eq(1).click()
        cy.wait(10000)
        recordsmanagementPage.deleteRecord();
  // cy.get('a[class="mobile-hide menu-enabled active"]>mat-icon[svgicon="IMX-jobs"]').click()
      //  recordsmanagementPage.clickOnAddNewJob(jobName, clientName)
      //workspacepage.logout()
        cy.wait(10000)
    })
})