/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import contractPage from '../../support/pageObjects/contractPage'


describe('VerifyIODatesInContractLineForAnually', function () {
    const loginpage = new LoginPage()

    const contractpage = new contractPage();
    before(function () {
        cy.wait(10000)
        // example.json is our test data for our spec/class file
        cy.fixture('contract_test_data').then(function (data) {
            this.data = data
        }),
            // before test
            cy.getCookies().should('have.length', 0)
        cy.clearCookies()
        cy.getCookies().should('be.empty')
        cy.intercept('https://intermx-test.apigee.net/', (req) => {
            req.headers['origin'] = 'https://staging.oneomg.io'
        })
        cy.clearLocalStorage
        cy.visit("https://staging.oneomg.io/?connection=Intermx")
        cy.wait(20000)
        cy.xpath("//*[contains(text(),'si')]").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("Please sign in below"))
            {
                     loginpage.loginToOneOmg()    
            }
        })   
    })
    /* === Test Created with Cypress Studio === */
    it('contract', function () {
        cy.wait(20000)
        contractpage.clickOnContractIcon()
        cy.wait(4000)
        contractpage.searchContractId(this.data.contractId)
        cy.wait(4000)
        contractpage.clickOnSearchButton()
        cy.wait(40000)
        contractpage.clickOnFirstRowInContract()
        cy.wait(4000)
        contractpage.clickOnLineItemId()
        cy.wait(45000)
        cy.get("div[class='ng-star-inserted'] div[class='info-row-label border-group-header']").click();
        cy.wait(10000);

        //case 1: Number of period-1 for Annual
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1');
        contractpage.selectPeriodLength('Annual');
        //cy.get('#mat-input-30').clear();
        cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).clear()
        //cy.get('#mat-input-30').type('6/1/2021');
        cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).type('6/1/2021');
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').click(); 
        cy.get('[class="io-elements"]>div>form>div>mat-form-field>div>div>div>input').should('have.value', '5/13/2021');

        //  cy.get('#mat-input-30').contains('5/31/2022').should('be.visible')
      //  cy.get('#mat-input-30').should('contain.text', '5/11/2022');
        //  cy.get('input[id="mat-input-130"]').contains('6/1/2021').should('be.visible');

        //case 2: Number of period-2 for Annual
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('2');
       // cy.get('#mat-input-30').click();
       // cy.get('#mat-input-30').clear();
       cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).clear()
        cy.wait(2000)
        //cy.get('#mat-input-30').type('6/1/2021');
        cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).type('6/1/2021');
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').click();
        cy.get('[class="io-elements"]>div>form>div>mat-form-field>div>div>div>input').should('have.value', '5/13/2021');


        //case 3: Number of period-3 for Annual
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('3');
        //cy.get('#mat-input-30').click();
        //cy.get('#mat-input-30').clear();
        cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).clear()
        cy.wait(4000)
       // cy.get('#mat-input-30').type('6/1/2021');
       cy.xpath("//mat-label[text()='Start Date']//parent::label//parent::span//parent::div//input[@formcontrolname='startDate']").eq(1).type('6/1/2021');
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').click();
        cy.get('[class="io-elements"]>div>form>div>mat-form-field>div>div>div>input').should('have.value', '5/13/2021');
       // workspacepage.logout()
        cy.wait(10000)
    })
})