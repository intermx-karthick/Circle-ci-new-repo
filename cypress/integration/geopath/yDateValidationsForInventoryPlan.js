/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyDateValidationsForInventoryPlan', function () {
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
    it('CreateMarketAndInventoryPlan', function () {
        //navigate to workspace
        cy.wait(20000)
        const targetDate = Cypress.moment()
            .add(0, 'year')
            .add(0, 'month')
            .add(0, 'day')
            .format('Day Month dd, yyyy')   // adjust format to suit the apps requirements Day Month dd, yyyy //'MM/DD/YYYY
        cy.log(targetDate);

        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()

        workspacepage.moveToInventoryPlanAndSelectPlanPeriod()
        cy.get('.mat-form-field').contains('Start Date').should('contain.text', (this.data.start_Date));
        cy.get('.mat-form-field').contains('End Date').should('contain.text', (this.data.end_Date));
        workspacepage.clickOnGenerateButton()
        cy.get('.mat-error').contains('Start Date is required').should('contain.text', (this.data.StartDate_ReqErr));
        cy.get('.mat-error').contains('End Date is required').should('contain.text', (this.data.EndDate_ReqErr));


        cy.get('[id="startDtPicker"]').click();
        cy.get('[id="startDtPicker"]').clear();
        cy.get('[id="startDtPicker"]').invoke('val', "05/01/2021").trigger('change')
        //cy.get('[id="startDtPicker"]').type("05/01/2021")
        //cy.get('[aria-label="' + targetDate + '"]').click() //check this 


        // cy.get('[id="endDtPicker"]').click();
        // cy.get('[id="endDtPicker"]').clear();
        //cy.get('[id="endDtPicker"]').type("05/01/2021")
        //workspacepage.clickOnStartDatePicker()
        workspacepage.clickOnGenerateButton()
        cy.get('.mat-error').contains('End Date is required').should('contain.text', (this.data.EndDate_ReqErr));

        cy.get('#startDtPicker').clear();
        cy.get('[id="endDtPicker"]').click();
        cy.get('[id="endDtPicker"]').clear();
        cy.get('[id="endDtPicker"]').invoke('val', "05/01/2021").trigger('change')
        //cy.get('[id="endDtPicker"]').type("05/01/2021")
        //workspacepage.clickOnEndDatePicker()
        workspacepage.clickOnGenerateButton()
        cy.get('.mat-error').contains('Start Date is required').should('contain.text', (this.data.StartDate_ReqErr));

        //  workspacepage.clickOnStartDatePicker()
        // workspacepage.clickOnGenerateButton()
      //  workspacepage.logout()
        cy.wait(10000)
    });
})