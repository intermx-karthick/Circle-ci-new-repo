/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyMarketPlanColumnLabels', function () {
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
    it('VerifyMarketPlanColumnLabels', function () {
        //navigate to workspace
        cy.wait(10000)
        cy.log("Step 1: Login in to the geopath staging site")
        cy.log("step 2: Redirects to the workspace")
        cy.log("step 3: Click 'Add Project' to create an new project")
        cy.log("step 4: Validate the created project title")
        cy.log("step 5: Click 'Add Plan' and select the 'Inventory Plan' tab")
        cy.log("step 6: Create 'Audience', 'Market', 'Operators' and 'Media' on Market Plan page")
        cy.log("step 7: Create Scenario Name and Scenario Description and click the generate button")
        cy.log("step 8: Go back to the Plan page and select as 'Generate Inventory Plan' page")

        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.wait(5000)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)
        workspacepage.clickOnGenerateButton()
        cy.wait(40000)


      //  cy.get("mat-table[role='grid']").contains('button','plan').should('be.visible')

       
       // cy.get('mat-header-row').contains('div button', ' Plan ').should('be.visible');

       //mat-table > mat-row.mat-row.cdk-row.mat-ripple.ng-tns-c501-146.element-row.highlight-bg.ng-star-inserted > mat-cell.mat-cell.cdk-cell.text-left.text-wrap-colum.cdk-column-audience.mat-column-audience.ng-tns-c501-146.ng-star-inserted > span
        //to verify column names

        // checking the matching condition

       // cy.get('[aria-label="Change sorting for planId"]').should('have.text',(this.data.plan))
       // cy.get('[aria-label="Change sorting for audience"]').should('contain.text', (this.data.Audience))
    //    cy.get('.cdk-column-audience > .mat-sort-header-container > .mat-sort-header-content').should('contain.text', (this.data.Audience))
    //    cy.get('.cdk-column-market > .mat-sort-header-container > .mat-sort-header-content').should('contain.text', (this.data.Market))
    //    cy.get('.cdk-column-trp > .mat-sort-header-container > .mat-sort-header-content').should('contain.text', (this.data.TRP))
    //    cy.get('.cdk-column-reach > .mat-sort-header-container > .mat-sort-header-content').should('contain.text', (this.data.Reach_perct))
    //    cy.get('.cdk-column-reachNet > .mat-sort-header-container > .mat-sort-header-content').should('have.text', (this.data.Reach_Net))
    //    cy.get('.cdk-column-frequency > .mat-sort-header-container > .mat-sort-header-content').should('have.text', (this.data.Frequency))
    //    cy.get('.cdk-column-targetInMarketImp > .mat-sort-header-container > .mat-sort-header-content').should('have.text', (this.data.Target_In_Mkts_Imp))
    //    cy.get('.cdk-column-targetImp > .mat-sort-header-container > .mat-sort-header-content').should('have.text', (this.data.Target_Imp))
    //    cy.get('.cdk-column-totalImp > .mat-sort-header-container > .mat-sort-header-content').should('have.text', (this.data.Total_Imp))


        /* ==== End Cypress Studio ==== */

        /*cy.contains('.cdk-column-planId', 'Plan').parent('mat-header-row')
        .find('.cdk-column-planId').then(cells => {
            return [...cells].map(cell => cell.text()) })
            .should(['Plan', 'Audience', 'Market']);
        })*/
    

       // workspacepage.logout()
        cy.wait(10000)
})
})

/*it('MarketPlanCreation', function () {


    cy.get('mat-header-row').contains('div button', 'Plan').then(elem => {
        return [...elem].map(elem => elem.text()) })
        .should(['Plan', 'Audience', 'Market']);
       // console.log(ele.next())
        // Do something with this specific element...
    });
})*/