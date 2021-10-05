/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyMarketPlanScenarioSummary', function () {
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
    it('VerifyMarketPlanScenarioSummary', function () {
        //navigate to workspace
        cy.wait(10000)
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
        cy.wait(20000)
        workspacepage.clickOnParametersIcon()

       // cy.get(".market-list-tip>li>div>div").contains('(202106) Persons 5+ yrs').should('be.visible')
      
     //  cy.get(':nth-child(1) > .filter-display > .filter-info > [fxlayout="column"] > .market-list-tip > li.ng-star-inserted > .ng-star-inserted > .market-name-display').contains('(202106) Persons 5+ yrs').should('be.visible')
       cy.get(".market-list-tip>li>div>div").contains(this.data.New_York_NY).should('be.visible')
        cy.get(".market-list-tip>li>div>div").contains(this.data.Lamar).should('be.visible')
        cy.get(".filter-display>div>div>div").contains(this.data.Junior_Poster).should('be.visible')
        cy.get("div:nth-child(5) div:nth-child(1) div:nth-child(2)").contains(this.data.one_week).should('be.visible')
        cy.get("div[class='ng-star-inserted']>div[class='filter-display']>div:nth-child(2)").contains(this.data.TRP_PLAN_GOAL_200).should('be.visible')


        cy.get(':nth-child(1) > .filter-display > .tip-title').should('contain.text', (this.data.Targeted_Audience))
        cy.get(':nth-child(2) > .filter-display > .tip-title').should('contain.text', (this.data.Targeted_Markets))
        cy.get(':nth-child(3) > .filter-display > .tip-title').should('contain.text', (this.data.Operators))
        cy.get(':nth-child(4) > .filter-display > .tip-title').should('contain.text', (this.data.Media))
        cy.get(':nth-child(5) > .filter-display > .tip-title').should('contain.text', (this.data.Plan_Period))
        cy.get(':nth-child(6) > .filter-display > .tip-title').should('contain.text', (this.data.Define_Goals))
  
        cy.get(":nth-child(1) > .filter-display > .filter-info > [fxlayout='column'] > .market-list-tip > li.ng-star-inserted > .ng-star-inserted > .market-name-display").should('contain.text', ' (202106)Persons 5+ yrs ')
       // workspacepage.logout()
        cy.wait(10000)
    })

})