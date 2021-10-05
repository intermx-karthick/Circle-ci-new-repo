/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyValueOfUnitsInInventoryPlan', function () {
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
        cy.wait(20000)
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
        cy.wait(60000);
        cy.get('[svgicon="IMX-dot"]').should('be.visible');
        cy.get('.mat-row > .cdk-column-units').should('contain.text', '1851')
        workspacepage.clickOnCreatedScenario();
        cy.get('.element-row > .cdk-column-spots').should('contain.text', '1850')
        workspacepage.clickOnExpandIconInInventoryPlan();
        cy.get('#inventory-plan-dialog-fullscreen > .mat-table > .element-row > .cdk-column-spots').should('contain.text', '1850')
      workspacepage.clickOnArrowButtonInInventory()
     // cy.get('.mat-table-responsive').should('contain.text', '1851')
        cy.get(':nth-child(2) > .cdk-column-plant_operator > .ng-star-inserted').should('contain.text', 'LAMAR');
       cy.get('[class="mat-cell cdk-cell cdk-column-scheduled_weeks mat-column-scheduled_weeks ng-star-inserted"]').should('contain.text', '1');
        workspacepage.clickOnCollapseTableInInventoryPlan()
      cy.get('[tooltip="Parameters"]').click()
       // cy.get('#mat-expansion-panel-header-21 > .mat-content > .mat-expansion-panel-header-title').click()
       cy.get("[id*='mat-expansion-panel-header-']").each(($e,index,$list) => {
        const text = $e.text()
        //cy.log(text)    
        if(text.includes("Audience"))
        {
            cy.get("[id*='mat-expansion-panel-header-']").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })

       // cy.get('.mat-select-value-text > .ng-tns-c224-234').click()
        //cy.get('#mat-option-67 > .mat-option-text').click()
        workspacepage.clickOnReGenerateButton()
        workspacepage.clickOnExpandIconInInventoryPlan();
        cy.get('#inventory-plan-dialog-fullscreen > .mat-table > .element-row > .cdk-column-spots').should('contain.text', '1850')
        workspacepage.clickOnArrowButtonInInventory()
       cy.get('[class="mat-cell cdk-cell cdk-column-scheduled_weeks mat-column-scheduled_weeks ng-star-inserted"]').should('contain.text', '1');
        workspacepage.clickOnCollapseTableInInventoryPlan()
       // workspacepage.logout()
        cy.wait(10000)
    });
})