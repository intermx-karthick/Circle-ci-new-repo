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
        recordsmanagementPage.AddNoteInGeneralPage(vendorName)
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
        recordsmanagementPage.FunctionalityOfDeleteShippingAddress()
           })

})

