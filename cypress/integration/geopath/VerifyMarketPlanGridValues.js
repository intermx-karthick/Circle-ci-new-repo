/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyMarketPlanGridValues', function () {
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
    it('VerifyMarketPlanGridValues', function () {
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
        //workspacepage.clickOnActionButton()
        //workspacepage.selectAction()

        cy.wait(40000)
    
        //assertion for audience value  anywhere in  table>row>cell
     //   cy.get("mat-table > mat-row >mat-cell").contains('span', '(202106) Persons 5+ yrs').should('be.visible')
        //assertion for audience value  in the specific row and column
    //    cy.get("mat-table > mat-row >mat-cell >span").contains('(202106) Persons 5+ yrs').should('be.visible')

        cy.get("mat-table > mat-row >mat-cell").contains('app-imx-market-table-section', 'New York, NY ')
            .should('be.visible')

        //assert audience
  //  cy.get('mat-cell').contains('(202106) Persons 5+ yrs').should('contain.text', '\n(202106) Persons 5+ yrs', 'verified')
        //assert dma
      //  cy.get('.mat-ripple > .cdk-column-audience')
        cy.get('mat-cell').contains(' New York, NY ').should('contain.text', '\nNew York, NY ', 'verified')
        //assert trp
        cy.get('mat-cell').contains('61.908').should('have.text', ('61.908'))
        cy.xpath("//mat-cell[text()=' 3.39% ']").should('have.text', (' 3.39% '))

        cy.get('mat-cell').contains('660,621').should('have.text', (' 660,621 '))
        cy.get('mat-cell').contains('18.25').should('have.text', (' 18.25 '))
        cy.get('mat-cell').contains('12,056,083').should('have.text', (' 12,056,083 '))
        cy.get('mat-cell').contains('12,326,532').should('have.text', (' 12,326,532 '))
        cy.get('mat-cell').contains('13,094,556').should('have.text', (' 13,094,556 '))
      //  workspacepage.logout()
        cy.wait(10000)
    });

   
})

