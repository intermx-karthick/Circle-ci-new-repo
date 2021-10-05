/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import contractPage from '../../support/pageObjects/contractPage'


describe('VerifyIODatesInContractLine', function () {
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
        cy.wait(10000)
        const targetDate = Cypress.moment()
            .add(0, 'year')
            .add(1, 'month')
            .add(10, 'day')
            .format('M/DD/YYYY')   // adjust format to suit the apps requirements Day Month dd, yyyy //'MM/DD/YYYY
        cy.log(targetDate);
        cy.wait(5000)
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

        /*   cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
           cy.get('.media-details__title').click();
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="startDate"]').clear();
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="endDate"]').clear();
   
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('0');
         //  cy.get('#mat-error-19').should('contain.text', (this.data.periodLengthError));
         //  cy.get('.mat-error').contains('PERIOD LENGTH MIN VALUE IS 1.').should('contain.text', (this.data.periodLengthError));
           // cy.get('#mat-input-29').should('have.text', '2')
           // cy.get('#mat-input-30').should('contain.text', '5/13/2021')
           // cy.get('#mat-input-31').should('contain.text', '7/12/2021')   
           // cy.get('#mat-input-39').should('contain.text', '100')  
   
   //case 2: Number of period-1
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1');
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="startDate"]').type('1/1/2022');
           cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').click();
           cy.get('.media-details__title').click();
          // cy.get('#mat-input-31').should('have.text', '1/31/2022');
         //  cy.get('form>mat-form-field>div>div>div>[formcontrolname="endDate"]').should('contain.text', '1/31/2022')
         // cy.get('[class="mat-icon notranslate date-picker-icon date-picker-icon_input mat-icon-no-color ng-tns-c107-560"]').click();
     //    cy.get('.mat-form-field.ng-tns-c107-126 > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-suffix > .mat-icon > svg').click(); 
      //   cy.get('mat-calendar-header>div>div>button>span[class="mat-button-wrapper"]').click({ force: true });
   //    cy.get('.mat-calendar-arrow').click();  
     // cy.get('[aria-label="2022"] > .mat-calendar-body-cell-content').click();
       //  cy.get('[aria-label="January 2022"] > .mat-calendar-body-cell-content').click();
     //  cy.get('#mat-input-42').should('contain.text', '1/1/2022')
   
   
   
     //case 3: Number of period-2
     cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
     cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('2');
     cy.get('form>mat-form-field>div>div>div>[formcontrolname="endDate"]').contains('2/28/2022').should('be.visible');
    // cy.get('[class="mat-input-element mat-form-field-autofill-control ng-tns-c107-561 cdk-text-field-autofill-monitored ng-valid ng-dirty ng-touched"]').should('contain.text', '2/28/2022');
   
     //case 4: Number of period-3
     cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
     cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('3');*/

        //Case 1 :  Number of period-2 - Monthly
        //assert
        //cy.get('form>mat-form-field>div>div>div>[formcontrolname="endDate"]').contains('2/28/2022').should('be.visible');

        cy.wait(5000)
        //Case 2 :  Number of period-1 - Monthly
        //assertion at extimate header level
        cy.get('input[formcontrolname="startDate"]').invoke('val').then((text) => {
            expect('2/15/2021').to.equal(text);
        })
        cy.wait(10000)
        //verify Estimate details
        cy.get("div[class='border-group-row ng-star-inserted']>div:nth-child(1)").contains('14').should('contain.text', ('14'));
        cy.get("div[class='border-group-row ng-star-inserted']>div:nth-child(2)").contains('01/06/2021').should('contain.text', ('01/06/2021'));
        cy.get("div[class='border-group-row ng-star-inserted']>div:nth-child(3)").contains('12/31/2021').should('contain.text', ('12/31/2021'));
        cy.wait(5000)
     //   cy.get('span').contains('Month').should('contain.text', ('Month'));
        //verify eztimate 100
       // cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
       cy.wait(5000)
       cy.xpath("//div[@class='ng-star-inserted' and text()=' 14 ']").contains('14').should('contain.text', ('14'));
        //update number of period from 2 to 1 and verify 
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1');
        //cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
        cy.xpath("//div[@class='ng-star-inserted' and text()=' 14 ']").contains('14').should('contain.text', ('14'));
        // cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").should('not.exist');

        // cy.get('mat-form-field').contains('Start Date').invoke('val', "05/12/2021").trigger('change')
        cy.wait(5000)
        cy.get('add-line-item-dialog').within(() => {
            cy.get('input[formcontrolname="startDate"]').invoke('val', "2/16/2021").trigger('change') // Only yield datepickers within add-line-item-dialog
        })


     //cy.get('mat-form-field div div div [formcontrolname="startDate"]').invoke('val', "05/12/2021").trigger('change')
     cy.wait(10000)
        cy.get('div').contains('Commission').click()
       // cy.get("circle:nth-child(1)").contains('#551875').should('contain.text', ('#551875'));

        //Case 3 :  Number of period-1.5 - Monthly
        //cy.get('mat-form-field').contains('Start Date').invoke('val', "05/13/2021").trigger('change')
        
       // cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
       cy.xpath("//div[@class='ng-star-inserted' and text()=' 14 ']").contains('14').should('contain.text', ('14'));
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1.5');
        //cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
        //cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").contains('#551875').should('contain.text', ('#551875'));




        cy.wait(5000)
        //Case 4 :  Number of period-2 - Quaterly
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('2');
        //cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
        cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
       // cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").contains('#551875').should('contain.text', ('#551875'));

       cy.wait(5000)
        contractpage.selectPeriodLength(this.data.Quarterly);
        //cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
        cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
        //cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").contains('#551875').should('contain.text', ('#551875'));

        cy.wait(5000)
        //Case 5 :  Number of period-1 - Quaterly
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1');
       // cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
       cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
       // cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").should('not.exist');


       cy.wait(10000)
        //Case 6 :  Number of period-2 - Annual
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('2');
       // cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
       cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
      //  cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").contains('#551875').should('contain.text', ('#551875'));
        contractpage.selectPeriodLength(this.data.Annual);
      //  cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
      cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
     //   cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").contains('#551875').should('contain.text', ('#551875'));
        //Case 7 :  Number of period-1 - Annual
        cy.wait(5000)
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').clear();
        cy.get('form>mat-form-field>div>div>div>[formcontrolname="numberOfPeriods"]').type('1');
     //   cy.get("div[class='border-group relative-container'] div[class='ng-star-inserted'] div div[class='ng-star-inserted']").contains('100').should('contain.text', ('100'));
     cy.xpath("//div[@class='ng-star-inserted' and text()=' 100 ']").contains('100').should('contain.text', ('100'));
        //cy.get("div:nth-child(3) div:nth-child(4) div:nth-child(1) mat-icon:nth-child(1) svg[fill='none'] circle").should('not.exist');
       // workspacepage.logout()
        cy.wait(10000)
    });
})

