/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyAssertionOfExportInventory', function () {
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
    it('MarketPlanCreationWithTwoAudience', function () {
        cy.wait(20000)
        cy.log("starts now")
       // cy.readFile('F://Cypress//intermx//cypress//fixtures//exportInventory.json').then(res => {

        cy.fixture('exportInventory').then(res => {
            cy.log(res)
            expect(res[0]).has.property('Scenario Name', 'Description');
            // expect(res[0]).has.property(campName, campName);

            expect(res[1]).has.property("Scenario Name", "Audience");
            expect(res[1]).has.property("cypress-automation651784", "(2020) undefined");
            expect(res[1]).has.property("field3", "Target Population");
            // expect(res[1]).has.property("field4", "21,299,241");

            expect(res[2]).has.property("Scenario Name", "Markets");
            // expect(res[2]).has.property("cypress-automation651784", "New York, NY");
            expect(res[2]).has.property("field3", "Total Market Population");
            // expect(res[2]).has.property("field4", "21,299,241");

            expect(res[3]).has.property("Scenario Name", "Delivery weeks");
            expect(res[3]).has.property("cypress-automation651784", "1");

            /*  expect(res[9]).has.property("Scenario Name", "Total Number of Units");
              expect(res[9]).has.property("cypress-automation651784", "Target Impressions");
              expect(res[9]).has.property("field3", "Total Impressions");
              expect(res[9]).has.property("field4", "Target Composition");
          
              expect(res[10]).has.property("Scenario Name", "1851");
              expect(res[10]).has.property("cypress-automation651784", "386,863,347");
              expect(res[10]).has.property("field3", "386,863,347");
              expect(res[10]).has.property("field4", "100%");
          
              expect(res[11]).has.property("Scenario Name", "Saved Inventory Sets");
              expect(res[11]).has.property("cypress-automation651784", "Inv_Set_01");
          
              expect(res[12]).has.property(this.data.Scenario_Name, this.data.Geopath_Spot_ID);
              expect(res[12]).has.property("cypress-automation651784", this.data.Geopath_Frame_ID);
              expect(res[12]).has.property(this.data.field3, this.data.Status);
              expect(res[12]).has.property(this.data.field4, this.data.Status_Description);
              expect(res[12]).has.property(this.data.field5, this.data.Operator_Spot_ID);
              expect(res[12]).has.property(this.data.field6, this.data.Plant_Operator);
              expect(res[12]).has.property(this.data.field7, this.data.Classification);
          
              expect(res[13]).has.property(this.data.Scenario_Name, "31023407");
              expect(res[13]).has.property("cypress-automation651784", "31023407");
              expect(res[13]).has.property(this.data.field3, this.data.Unmeasured);
              expect(res[13]).has.property(this.data.field4, this.data.inventoryWarning);
              expect(res[13]).has.property(this.data.field5, "7042");
              expect(res[13]).has.property(this.data.field6, this.data.Lamar);
              expect(res[13]).has.property(this.data.field7, this.data.Roadside);
          */
        })
    })

})