/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import WorkspacePage from '../../support/pageObjects/WorkspacePage'


describe('VerifyExportMarketPlan', function () {
    const loginpage = new LoginPage()

    const workspacepage = new WorkspacePage();
    before(function () {
        cy.wait(5000)
        // example.json is our test data for our spec/class file
        cy.fixture('test_data').then(function (data) {
            this.data = data
        }),

            cy.fixture('exportMarket').then(function (exportMarket) {
                this.exportMarket = exportMarket
            })
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
    it('ExportMarketPlan', function () {
        const data = [
            "Market",
            "Audience",
            "Media Type",
            "Operator",
            "Spots",
            "Weeks",
            "Total Imp"
        ];
        cy.wait(20000)
        // navigate to workspace
        workspacepage.clickOnworkspace()
        const campName = workspacepage.generate_random_string(8)

        workspacepage.createNewProject(campName)
        cy.wait(4000)
        cy.get('.text-tooltip').should('have.text', campName);

        workspacepage.clickOnAddPlan()
        workspacepage.selectAudience(this.data.persons_5plus);
        workspacepage.selectMarket(this.data.new_york)
        workspacepage.selectOperator(this.data.lamar)
        workspacepage.selectMedia()
        workspacepage.typeScenarioName(campName)
        workspacepage.clickOnGenerateButton()
        cy.wait(20000)
        workspacepage.clickOnExport()
        cy.wait(20000)

        cy.get('.mat-ripple > .cdk-column-audience').should('contain.text', '(202106)Persons 5+ yrs')
        cy.get('.mat-ripple > .cdk-column-market').should('contain.text', 'New York, NY')
        cy.get('.mat-ripple > .cdk-column-trp').should('contain.text', '61.908')
     
        cy.fixture('exportMarket').then(r => {
            cy.log(r)
            expect(r.Market).to.be.oneOf([
                this.data.New_York_NY, this.data.New_York_NY
            ]);
            expect(r.Audience).to.be.oneOf([
                "(2021) Persons 5+ yrs", "(2021) Persons 5+ yrs"
            ]);

            expect(r).have.property('Market', 'New York, NY')
            expect(r).have.property('Audience', '(2021) Persons 5+ yrs')
            expect(r).have.property('Media Type', 'Junior Poster')
            expect(r).have.property('Operator', 'Lamar')
            expect(r).have.property('Spots', '203')
            expect(r).have.property('Weeks', '1')
            expect(r).have.property('Total Imp', '11,827,704')
            expect(r).have.property('Target Imp', '11,091,944')
            expect(r).have.property('Target In-Mkts Imp', '10,841,431')
            expect(r).have.property('Reach %', '20.61')
            expect(r).have.property('Reach Net', '4,131,147')
            expect(r).have.property('Frequency', '2.62')
            expect(r).have.property('TRP', '54.096')

          //  workspacepage.logout()
            cy.wait(10000)
        })

    })
})