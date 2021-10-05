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
    it('VerifyMarketPlanColumnLabels', function () {
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
        cy.wait(40000)


      //  cy.get("mat-table[role='grid']").contains('button','plan').should('be.visible')

       
       // cy.get('mat-header-row').contains('div button', ' Plan ').should('be.visible');

       //mat-table > mat-row.mat-row.cdk-row.mat-ripple.ng-tns-c501-146.element-row.highlight-bg.ng-star-inserted > mat-cell.mat-cell.cdk-cell.text-left.text-wrap-colum.cdk-column-audience.mat-column-audience.ng-tns-c501-146.ng-star-inserted > span
        //to verify column names

        // checking the matching condition

       // cy.get('[aria-label="Change sorting for planId"]').should('have.text',(this.data.plan))
       // cy.get('[aria-label="Change sorting for audience"]').should('contain.text', (this.data.Audience))
          cy.xpath("//div[text()=' Audience ']").should('contain.text', (this.data.Audience))
       // cy.get('[aria-label="Change sorting for market"]').should('contain.text', (this.data.Market))
          cy.xpath("//div[text()=' Market ']").should('contain.text', (this.data.Market))
       // cy.get('[aria-label="Change sorting for trp"]').should('contain.text', (this.data.TRP))
          cy.xpath("//div[text()=' TRP ']").should('contain.text', (this.data.TRP))
      //  cy.get('[aria-label="Change sorting for reach"]').should('contain.text', (this.data.Reach_perct))
           cy.xpath("//div[text()=' Reach % ']").should('contain.text', (this.data.Reach_perct))
       // cy.get('[aria-label="Change sorting for reachNet"]').should('have.text', (this.data.Reach_Net))
          cy.xpath("//div[text()=' Reach Net ']").should('have.text', (this.data.Reach_Net))
       // cy.get('[aria-label="Change sorting for frequency"]').should('have.text', (this.data.Frequency))
           cy.xpath("//div[text()=' Frequency ']").should('have.text', (this.data.Frequency))
       // cy.get('[aria-label="Change sorting for targetInMarketImp"]').should('have.text', (this.data.Target_In_Mkts_Imp))
       cy.xpath("//div[text()=' Target In-Mkts Imp. ']").should('have.text', (this.data.Target_In_Mkts_Imp))
        //cy.get('[aria-label="Change sorting for targetImp"]').should('have.text', (this.data.Target_Imp))
        cy.xpath("//div[text()=' Target Imp. ']").should('have.text', (this.data.Target_Imp))
        //cy.get('[aria-label="Change sorting for totalImp"]').should('have.text', (this.data.Total_Imp))
        cy.xpath("//div[text()=' Total Imp. ']").should('have.text', (this.data.Total_Imp))


        /* ==== End Cypress Studio ==== */

        /*cy.contains('.cdk-column-planId', 'Plan').parent('mat-header-row')
        .find('.cdk-column-planId').then(cells => {
            return [...cells].map(cell => cell.text()) })
            .should(['Plan', 'Audience', 'Market']);
        })*/
    
     //   workspacepage.logout()
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