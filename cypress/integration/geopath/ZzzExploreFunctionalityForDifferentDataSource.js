/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyTotalNumOfSpotsOnDifferentDataSource', function () {
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
        //Click on delete audience button in summary
        cy.get('.ng-star-inserted > [fxlayout="row"] > .mat-icon').click()

        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectDatasource2021();
        workspacepage.selectDatasource2020();

        workspacepage.selectMarketForInventoryPlan(this.data.new_york)

        workspacepage.selectOperator(this.data.lamar)

        workspacepage.selectInventory(this.data.New_York_Murals)

        workspacepage.typeInventoryScenarioName(campName)

        workspacepage.clickOnGenerateButton()
        cy.wait(4000)
        cy.get('.primary-color-text').click()
        cy.wait(130000)
        cy.get(':nth-child(2) > .cdk-column-aud_name').should('have.text', '(202106)Persons 5+ yrs')
        cy.get(':nth-child(4) > .cdk-column-aud_name').should('have.text', '(2021)Persons 5+ yrs')
        cy.get(':nth-child(6) > .cdk-column-aud_name').should('have.text', '(2020)Persons 5+ yrs')

        cy.get(':nth-child(8) > .cdk-column-spots').should('have.text', ' 1850 ')
        cy.get(':nth-child(10) > .cdk-column-spots').should('have.text', ' 1851 ')
        cy.get(':nth-child(12) > .cdk-column-spots').should('have.text', ' 1849 ')
        cy.wait(10000);
        workspacepage.clickOnMap();
        cy.wait(20000);
        cy.visit('https://gisdev.geopath.io/explore', {
            onBeforeLoad(win) {
                cy.stub(win, 'open')
            }

        })
        cy.wait(8000)
        cy.get('.data-source-title').should('have.text', 'DATA SOURCE (202106) keyboard_arrow_down')
        cy.wait(4000)
        cy.get('.e2e-applyed-audience-name').should('have.text', 'Persons 5+ yrs')
        cy.wait(4000)
        cy.get('.e2e-inventory-count').should('have.text', ' 1,850  selected of 1,850 Spots in filter ')

        cy.wait(4000)
        cy.get('.data-source-title').click()
        cy.get(':nth-child(2) > .mat-list-item-content > .mat-list-text > .action-item > div').click()
        //cy.get('.imx-button-primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='Apply']").click()
        cy.wait(4000)
        cy.get('.e2e-applyed-audience-name').should('have.text', 'Persons 0+ yrs')
        cy.wait(4000)
        cy.get('.e2e-inventory-count').should('have.text', ' 1,851  selected of 1,851 Spots in filter ')

        cy.wait(4000)
        cy.get('.data-source-title').click()
        cy.get(':nth-child(3) > .mat-list-item-content > .mat-list-text > .action-item > div').click()
        //cy.get('.imx-button-primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='Apply']").click()
        cy.wait(4000)
        cy.get('.e2e-applyed-audience-name').should('have.text', 'Persons 0 yrs')
        cy.wait(4000)
        cy.get('.e2e-inventory-count').should('have.text', ' 1,849  selected of 1,849 Spots in filter ')
        

      //  cy.get(':nth-child(1) > .mat-card > .mat-card-content > .inventory-card > .address-container > :nth-child(8)').should('have.text', 'Geopath Spot ID: 30996730')
     //   cy.get('.test-filter-inventory').click()
     //   cy.get('#mat-chip-list-3 > .mat-chip-list-wrapper > .overline').click()
      //  cy.get('#mat-chip-list-input-1').type('')
     // workspacepage.logout()
        cy.wait(10000)
    })
})