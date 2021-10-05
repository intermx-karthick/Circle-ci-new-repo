/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifySummaryOfAudienceAndMarketInAdddScenario', function () 
{

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
      it('VerifySummaryOfAudienceAndMarketInAdddScenario', function () {
        //navigate to workspace
        cy.wait(10000)
        workspacepage.clickOnworkspace()
        workspacepage.clickOnAddScenario()
          // Market Plan summary
          //select  audience
          
        workspacepage.selectAudience("Persons 5+ yrs");
        // cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
        // cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        // cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click({ multiple: true });
        //select market plan new_york
        workspacepage.selectMarket(this.data.new_york)
          //select  audience
        cy.get('.audience-name-display').contains("Persons 5+ yrs").should('be.visible');
        //cy.xpath("//div[text()='Persons 5+ yrs ']").contains("Persons 5+ yrs").should('be.visible');
        cy.get('.market-name-display').contains(this.data.New_York_NY).should('be.visible')
        // cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
        // cy.get(':nth-child(2) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        // cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click({ multiple: true });
       
        workspacepage.selectAudience("Persons 0+ yrs");
        //select market plan ChicagoIL
        workspacepage.selectMarket(this.data.ChicagoIL)
        //cy.get(':nth-child(2) > [fxlayout="row"] > .audience-name-display').contains("Persons 0+ yrs (Total Population)").should('be.visible');
        cy.get(':nth-child(2) > [fxlayout="row"] > .audience-name-display').contains("Persons 0+ yrs ").should('be.visible');
        cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center;"] > [fxlayout="row"] > .market-name-display').should('contain.text', this.data.ChicagoIL).should('be.visible');
        //verify the count of  audience and market values
        cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.AUDIENCE_2).should('be.visible')
        cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.MARKETS_2).should('be.visible')
        //click on delete icons
        cy.get('.audience-list-tip > :nth-child(1) > [fxlayout="row"] > .mat-icon').click()
        cy.get('.audience-list-tip > .ng-star-inserted > [fxlayout="row"] > .mat-icon').click()
        cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center; margin-bottom: 0.5rem;"] > [fxlayout="row"] > .mat-icon').click()
        cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center;"] > [fxlayout="row"] > .mat-icon').click()
        workspacepage.clickOnGenerateButton()
          //verify error message
        cy.get('.mat-snack-bar-container').should('contain.text', 'Market Plan should have atleast one Audience, Market and Media Type');
        //verify the count of  audience and market values
        cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.AUDIENCE_0).should('be.visible')
        cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.MARKETS_0).should('be.visible')


        // Inventory Plan summary
        workspacepage.clickOnInventoryPlan()
        workspacepage.clickOnGenerateButton()
        //verify error message
         cy.get('.mat-snack-bar-container').should('contain.text', 'Market Plan should have atleast one Audience, Market and Media Type');
         //select  audience
         workspacepage.selectAudience("Persons 0+ yrs");
        //  cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
        //  cy.get(':nth-child(2) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        //  cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click({ multiple: true });
         //select market plan ChicagoIL
         workspacepage.selectMarket(this.data.ChicagoIL)
         workspacepage.clickOnYesButtonInPopup()
         //select market plan new_york
         workspacepage.selectMarket(this.data.new_york)
         workspacepage.clickOnYesButtonInPopup()
         //assert audience and market values
         cy.get('.audience-name-display').contains("Persons 0+ yrs").should('be.visible');
        // cy.get(':nth-child(2) > [fxlayout="row"] > .audience-name-display').contains("Females 0+ yrs").should('be.visible');
         cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center; margin-bottom: 0.5rem;"] > [fxlayout="row"] > .market-name-display').should('contain.text', this.data.ChicagoIL).should('be.visible');
         cy.get('.market-name-display').contains(this.data.New_York_NY).should('be.visible')
         //verify the count of  audience and market values
         cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.AUDIENCE_2).should('be.visible')
         cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.MARKETS_2).should('be.visible')
         //delete audience and market values
         cy.get('.audience-list-tip > :nth-child(1) > [fxlayout="row"] > .mat-icon').click()
         cy.get('.audience-list-tip > .ng-star-inserted > [fxlayout="row"] > .mat-icon').click()
         cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center; margin-bottom: 0.5rem;"] > [fxlayout="row"] > .mat-icon').click()
         cy.get('[style="flex-flow: row wrap; box-sizing: border-box; display: flex; place-content: center flex-start; align-items: center;"] > [fxlayout="row"] > .mat-icon').click()
         workspacepage.clickOnGenerateButton()
         //verify error message
         cy.wait(200)
         cy.get('.mat-snack-bar-container').should('contain.text', 'Inventory Plan should have atleast one Audience and Market');
         cy.get('.inventory-aligin > :nth-child(1)').should('contain.text', this.data.ChicagoIL).should('be.visible');
         cy.get('.inventory-aligin > :nth-child(2)').contains(this.data.New_York_NY).should('be.visible')
       //verify the count of  audience and market values
         cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.AUDIENCE_0).should('be.visible')
         cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').contains(this.data.MARKETS_0).should('be.visible')
         //workspacepage.logout()
         cy.wait(10000)
    });
})