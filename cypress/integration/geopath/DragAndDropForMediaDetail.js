/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyDragAndDropForMediaDetail', function () {
    
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
        cy.get('.ng-star-inserted > [fxlayout="row"] > .mat-icon').click()
        workspacepage.selectAudience(this.data.persons_5plus);

        workspacepage.selectMarketForInventoryPlan(this.data.new_york)

        workspacepage.selectOperator(this.data.lamar)

        workspacepage.selectInventory(this.data.New_York_Murals)

        workspacepage.typeInventoryScenarioName(campName)

        workspacepage.clickOnGenerateButton()
        cy.wait(3000)
        cy.get('.primary-color-text').click()
        cy.wait(45000)

        //verify Opertor as first column 
        cy.get(':nth-child(2) > .cdk-column-accordion > .mat-icon').click()
        cy.wait(2000)
        cy.get('mat-header-row').eq(1).contains('Operator')

        //verify operator as first column in Expanded screen
        workspacepage.clickOnExpandIconInInventoryPlan()
        cy.wait(2000)
        cy.get('mat-header-row').eq(1).contains('Operator')
        workspacepage.clickOnCollapseTableInInventoryPlan()

        workspacepage.clickOnCustomizeColumns()
        //reset to default state
        cy.get('.primary > .mat-button-wrapper').click()

        workspacepage.clickOnCustomizeColumns()

        //click on pln summary
        cy.get('mat-select>div>div>span>span').contains('Plan Summary').click()
        //select Media type
        cy.get('.mat-option-text').contains('Media Detail').click()

        cy.get(':nth-child(11) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()

        cy.wait(200)
        cy.get(':nth-child(12) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(13) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(10) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(10) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(9) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(8) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)
        cy.get(':nth-child(7) > div > span').trigger('mousedown', { button: 0 })
        cy.get('#list-block-1 > :nth-child(3)').trigger('mousemove', { button: 1 })
        cy.get('#list-block-1 > :nth-child(3)').click()
        cy.wait(200)

        cy.get('#list-block-2 > :nth-child(1) > div').trigger('mousedown', { button: 0 })
        cy.get('#list-block-2 > :nth-child(2) > div').trigger('mousemove', { button: 1 })
        cy.get('#list-block-2 > :nth-child(2) > div').click()


        cy.get('.primary-bg > .mat-button-wrapper').click()
        cy.wait(2000)
        //verify column as Geopath Spot ID
        cy.get('mat-header-row').eq(1).contains('Geopath Spot ID')

        cy.wait(2000)
        //verify column as Geopath Spot ID
        workspacepage.clickOnExpandIconInInventoryPlan()
        cy.get('mat-header-row').eq(1).contains('Geopath Spot ID')
        cy.wait(2000)
        workspacepage.clickOnCollapseTableInInventoryPlan()

        cy.get('line').click()
        //reset to default state
        cy.get('.primary > .mat-button-wrapper').click()
        cy.wait(2000)
        cy.get('mat-header-row').eq(1).contains('Operator')
        //workspacepage.logout()
        cy.wait(10000)
    });
})