/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyInventoryDataInMapVIew', function () {
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
    it('CreateInventoryPlan', function () {
        //navigate to workspace
        cy.wait(10000)
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()

        workspacepage.selectAudience(this.data.persons_5plus);

        workspacepage.selectMarketForInventoryPlan(this.data.new_york);
        workspacepage.selectInventory("Inv_Set_01");
        cy.get('.audience-list-tip > :nth-child(1) > [fxlayout="row"] > .mat-icon').click()
        workspacepage.clickOnGenerateButton();
        workspacepage.clickOnCreatedScenario();
        cy.wait(10000);
        workspacepage.clickOnMap();
        cy.wait(10000);
        cy.visit('https://gisdev.geopath.io/explore', {
  onBeforeLoad(win) {
    cy.stub(win, 'open')
  }
})

//cy.window().its('open').should('be.called')
    //  cy.get("@windowOpen").should("be.called");
     //   cy.get('[class="subtitle-1 margin-bottom-10 margin-bottom-5 button-primary-link ng-star-inserted"]').should('contain.text', '1 Week Metrics');
     cy.wait(10000);  
cy.get('.card-content > .subtitle-1').should('contain.text', '1 Week Metrics')
//cy.get('.mat-select-value-text > .ng-tns-c224-135').should('contain.text', 'New York, NY')
//cy.get('.mat-select-min-line').should('contain.text', 'New York, NY')
cy.get('.e2e-applyed-audience-name').should('contain.text', 'Persons 5+ yrs')
cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > .no-margin').should('contain.text', 'LAMAR');

cy.get('.card-heading > .ng-star-inserted').click();
    cy.get('.list-pagecount').should('contain.text', '1851 selected of 1,851 Spots in filter');
    cy.get('[title="Data Source: 202106"]').should('contain.text', 'Data Source: 202106');
     cy.get('[title="Audience: Persons 5+ yrs"]').should('contain.text', 'Audience: Persons 5+ yrs');
     cy.get('[title="Delivery Weeks: 1"]').should('contain.text', 'Delivery Weeks: 1');
     //cy.get('[title="Market: New York, NY"]').should('contain.text', 'Market: New York, NY');
     cy.get('[title="Market: Albany-Schenectady-Troy, NY,New York, NY"]').should('contain.text', 'Market: Albany-Schenectady-Troy, NY,New York, NY');
     cy.get(':nth-child(2) > .cdk-column-plant_operator').should('contain.text', 'LAMAR');
   //  workspacepage.logout()
        cy.wait(10000)
    });
})