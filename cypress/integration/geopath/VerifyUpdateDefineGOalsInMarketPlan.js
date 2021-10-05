/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'

describe('VerifyUpdateDefineGOalsInMarketPlan', function () {
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
     it('VerifyUpdateDefineGOalsInMarketPlan', function () {
        //navigate to workspace
        cy.wait(20000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)
        workspacepage.clickOnGenerateButton()
        workspacepage.clickOnParametersIcon()
    //    workspacepage.selectDefineGoals()
     //   cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center; margin-bottom: 0.5rem;"]').contains(' Target In-Mkt Imp Plan Goal  - 100 ')
     //   cy.get(':nth-child(6) > .filter-display > [style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center;"]').contains(' Effective Reach - 3 ')
       workspacepage.clickOnReGenerateButton()
      // workspacepage.logout()
       cy.wait(10000)
     })

    })