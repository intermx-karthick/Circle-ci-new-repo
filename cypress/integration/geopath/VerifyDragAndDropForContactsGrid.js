/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import recordsManagementPage from '../../support/pageObjects/recordsManagementPage'


describe('VerifyDragAndDropForContactsGrid', function () {
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
    it('VerifyDragAndDropForContactsGrid', function () {
        cy.wait(20000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        recordsmanagementPage.clickOnContact()
        cy.wait(2000)
        recordsmanagementPage.clickOnCustomizeColumns()
        cy.get('#list-block-2 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(2) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(2) > div').click()
        cy.wait(2000)
        recordsmanagementPage.clickOnApplyChanges()
        cy.wait(2000)
        //click on reset changeSets
        recordsmanagementPage.clickOnCustomizeColumns()
        cy.wait(2000)
        recordsmanagementPage.clickOnResetChanges()
      //  workspacepage.logout()
        cy.wait(10000)
    })
})