/// <reference types="Cypress" />
import LoginPage from '../../support/pageObjects/LoginPage'
import ExplorePage from '../../support/pageObjects/ExlporePage'
import recordsManagementPage from '../../support/pageObjects/recordsManagementPage'




describe('Test the functionality flow of Create, Update and delete of vendor, contacts, attachments and  shipping Address on Record Management page', function () {
    const loginpage = new LoginPage()

    const recordsmanagementPage = new recordsManagementPage();
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
   it('Test the functionality flow of Create, Update and delete of vendor, contacts, attachments and  shipping Address on Record Management page', function () {
        cy.wait(20000)
        const vendorName = recordsmanagementPage.generate_random_string(8)
        cy.wait(2000)
        recordsmanagementPage.clickOnRecordsManagementIcon();
        cy.wait(2000)
        recordsmanagementPage.clickOnAddVendorButton();
        cy.wait(2000)
        recordsmanagementPage.CheckValidationInAddVendorScreen()
        cy.wait(2000)
        recordsmanagementPage.createNewVendorandValidatetheNotification(vendorName);
        cy.wait(2000)
        recordsmanagementPage.ValidatetheVendorNameDetails(vendorName)
        cy.wait(2000)
        recordsmanagementPage.UpdatetheVendorandValidatetheNotification()
        cy.wait(2000)
      /*  recordsmanagementPage.AddNoteInGeneralPage(vendorName)
        cy.wait(2000)
        recordsmanagementPage.ValidateEmailandNoteContentForNewlyAddedNoteInGeneralPage(vendorName)
        cy.wait(2000)
        recordsmanagementPage.EditNoteContentInGeneralPageandSave(vendorName)
        cy.wait(2000)
        recordsmanagementPage.ValidateEmailandNoteContentForNewlyEditedNoteInGeneralPage(vendorName)
        cy.wait(2000)
        recordsmanagementPage.DeleteNoteInGeneralPage(vendorName)
        cy.wait(2000)
        recordsmanagementPage.RedirectsContactsandValidateContacts()
        cy.wait(2000)
        recordsmanagementPage.AddingNewContactandvalidateNotificationandContactTable(vendorName)
        cy.wait(2000)
        recordsmanagementPage.DuplicateFunctionalityOfContactsValidate(vendorName)
        cy.wait(2000)
        recordsmanagementPage.RedirectsAttachmentsAndValidateAttachmentValidation()
        cy.wait(2000)
        recordsmanagementPage.RedirectsShppingAddressAndAddNewAddressandValidateNotification(vendorName,this.data.ShippingAddressForVendors,this.data.AddressForVendors,this.data.CityForVendors,this.data.ContactNameforVendors,this.data.PhoneNumberForVendors,this.data.EmailAddress)
        cy.wait(2000)
        recordsmanagementPage.FunctionalityOfDuplicateOnShippingAddressandValidate(vendorName)
        cy.wait(2000)
        recordsmanagementPage.FunctionalityOfDeleteShippingAddress()*/
        cy.get('.back-to-link').click()
        cy.wait(20000)
        cy.get('[formcontrolname="name"]').eq(1).click().type(vendorName)
        cy.wait(2000)
        //cy.get('[formcontrolname="name"]')
        //cy.wait(2000)
        cy.get('.imx-button-primary > .mat-button-wrapper').eq(1).click()
        cy.wait(2000)
        //  cy.get('input[formcontrolname="name"]').should('have.text',vendorName)
        cy.get('.primary-color-text').should('have.text', ' ' + vendorName + ' ')
        cy.wait(2000)
        //cy.get('.mat-row > .cdk-column-parentCompany').should('have.text', ' CODY RIGSBY ')
        cy.wait(2000)
        cy.get('.mat-row > .cdk-column-city').should('have.text', ' HOLTSVILLE ')

        cy.get('.primary-color-text').click()
        // cy.get('.mat-form-field.ng-tns-c118-115 > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').should('have.text', vendorName)
        // cy.get('input[formcontrolname="parentCompany"]').should('have.text','CODY RIGSBY')
        //click on back to agencies list
        cy.get('.back-to-link').click()
        //click on expand table
        recordsmanagementPage.clickOnExpandButton()
        cy.get('#vendor-fullscreen-scroll > .mat-table > .mat-row > .imx-link-cursor').should('have.text', ' '+vendorName+' ')
       // cy.get('#vendor-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-parentCompany').should('have.text', ' CODY RIGSBY ')
        cy.get('#vendor-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-state').should('have.text', ' NY ')
        cy.get('#vendor-fullscreen-scroll > .mat-table > .mat-row > .cdk-column-city').should('have.text', ' HOLTSVILLE ')

        cy.get('[fxflex="80"] > .mat-icon > svg').click()
        cy.wait(10000)
        recordsmanagementPage.deleteRecord()
       // workspacepage.logout()
        cy.wait(10000)
    })

})

