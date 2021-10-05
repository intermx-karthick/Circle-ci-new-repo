/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('CreateScenariForInventoryFromMapView', function () {
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
        cy.wait(20000)
        //navigate to workspace
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)
        const scenarioName = workspacepage.saveAsScenarioRandom(8)
        workspacepage.createNewProject(campName)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.clickOnInventoryPlan()
        workspacepage.selectDatasource2021();
        workspacepage.selectMarketForInventoryPlan(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectInventory(this.data.New_York_Murals)
        workspacepage.typeInventoryScenarioName(campName)
        workspacepage.clickOnGenerateButton()

        //     workspacepage.generateInventoryPlanFromMarketPlan()
        cy.get(':nth-child(1) > .status-cell > .imx-ml-10 > [fxlayout="row"] > .primary-color-text').click()

        cy.wait(20000);
        workspacepage.clickOnMap();
        cy.wait(20000);
        cy.visit('https://gisdev.geopath.io/explore', {
            onBeforeLoad(win) {
                cy.stub(win, 'open')
            }
        })
        workspacepage.clickOnDataSource2021InMapView()
      //  workspacepage.clickOnSelectAllDropdownInMapView()
        //workspacepage.selectSaveAsScenarioInMapView(scenarioName)

        //  cy.get('.mat-simple-snackbar > :nth-child(1)').should('have.text', 'Scenario saved');
        //cy.get('.mat-snack-bar-container').should('contain.text', "Scenario '" + scenarioName + "' saved successfully.DISMISS");
        //workspacepage.verifyScenarioUnderActionInMapView(scenarioName)
        cy.wait(30000)
        cy.xpath("//div[text()=' 1,851  selected of 1,851 Spots in filter ']").should('contain.text', ' 1,851  selected of 1,851 Spots in filter ')
        

        workspacepage.clickOnworkspace()

        cy.get('#mat-tab-label-4-0 > .mat-tab-label-content').click()
        //cy.get(':nth-child(1) > .status-cell > .imx-ml-10 > [fxlayout="row"] > .primary-color-text').should('have.text', scenarioName)
       // workspacepage.logout()
        cy.wait(10000)
    })
})