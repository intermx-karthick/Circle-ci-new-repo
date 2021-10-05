

class recordsManagementPage {

    generate_random_string() {
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `vendor-automation${id}`
        return testname;
    }

    generate_random_string_client() {
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `client-automation${id}`
        return testname;
    }

    generate_random_string_agencies(){
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `agencies-automation${id}`
        return testname;
    }

    generate_random_string_contact(){
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `automation${id}`
        return testname;
    }

    generate_random_string_Job(){
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `automation${id}`
        return testname;
    }

    clickOnRecordsManagementIcon() {
        cy.get('[routerlink="/records-management-v2"] > .mat-icon').click()
    }

    clickOnAddVendorButton() {
        cy.get('.imx-button-stroked > .mat-button-wrapper').click()
    }

    CheckValidationInAddVendorScreen()
    {
        cy.xpath("//span[text()='Save Vendor ']").click()
        cy.wait(3000)
        cy.xpath("//mat-error[text()='Vendor Name is required. ']").should('contain.text', "Vendor Name is required. ")
        cy.wait(2000)
    }

    createNewVendorandValidatetheNotification(vendorName) {
        cy.wait(2000);
        cy.get('input[formcontrolname="name"]').eq(1).click().type(vendorName)
        //cy.get('input[formcontrolname="name"]')
        cy.get('input[formcontrolname="parentCompany"]').click()
        cy.wait(2000)
        cy.xpath("//span[text()='Save Vendor ']").click()
        cy.xpath("//span[text()='Vendor created successfully!']")
    }

    ValidatetheVendorNameDetails(vendorName)
    {
        cy.xpath("//h4[text()='"+vendorName+" Details']").should('contain.text', ""+vendorName+" Details")
        cy.wait(1000)
    }

    UpdatetheVendorandValidatetheNotification()
    {
        cy.wait(2000)
        cy.get('input[formcontrolname="email"]').click()
        cy.get('input[formcontrolname="email"]').type('mkrishnappa@intermx.com')
        cy.get('input[formcontrolname="billingEmail"]').click()
        cy.get('input[formcontrolname="billingEmail"]').type('mkrishnappa@intermx.com')
        cy.get('input[formcontrolname="businessWebsite"]').click()
        cy.get('input[formcontrolname="businessWebsite"]').type('https://omg.integration.intermx.io')
        cy.get('input[formcontrolname="address"]').eq(1).click().type('intermx')
        //cy.get('input[formcontrolname="address"]')
        cy.get('input[formcontrolname="zipCode"]').eq(1).click()
        cy.get('span[class="mat-option-text"]').contains('00501').click()
        cy.wait(2000)
        cy.xpath("//span[text()='Save']").eq(1).click()
        cy.xpath("//span[text()='Vendor updated successfully']")
    }

    AddNoteInGeneralPage(vendorName)
    {
        cy.xpath("//mat-label[text()='Please enter Notes here']//parent::label//parent::span//parent::div//textarea").click()
        cy.wait(4500)
        cy.xpath("//*[@class='cke_wysiwyg_frame cke_reset']").then(function($ele)
        {
            var ifele = $ele.contents().find("body[class='cke_editable cke_editable_themed cke_contents_ltr cke_show_borders']>p")
            cy.wrap(ifele).click().type(vendorName)
        })
        cy.wait(1500)
        cy.xpath("//span[text()='ADD NOTE']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Vendor note created successfully!']").should('contain.text', "Vendor note created successfully!")
    }

    ValidateEmailandNoteContentForNewlyAddedNoteInGeneralPage(vendorName)
    {
        cy.xpath("//p[text()='"+vendorName+"']").should('contain.text', ""+vendorName+"")
        cy.xpath("//p[text()='Drafted by test-keith-guerke@intermx.com']").should('contain.text', "Drafted by test-keith-guerke@intermx.com")
    }

    EditNoteContentInGeneralPageandSave(vendorName)
    {
        cy.xpath("//p[text()='"+vendorName+"']").trigger('onmouseover')
        cy.xpath("//span[text()='EDIT']").click({force: true})
        cy.wait(1500)
        cy.xpath("//*[@class='cke_wysiwyg_frame cke_reset']").then(function($ele)
        {
            var ifele = $ele.contents().find("body[class='cke_editable cke_editable_themed cke_contents_ltr cke_show_borders']>p")
            cy.wrap(ifele).eq(1).click().type(vendorName)
        })
        cy.wait(1500)
        cy.xpath("//span[text()='save edit']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Vendor note updated successfully!']").should('contain.text', "Vendor note updated successfully!")
    }

    ValidateEmailandNoteContentForNewlyEditedNoteInGeneralPage(vendorName)
    {
        cy.xpath("//p[text()='Changed by test-keith-guerke@intermx.com']").should('contain.text', "Changed by test-keith-guerke@intermx.com")
        cy.xpath("//p[text()='"+vendorName+""+vendorName+"']").should('contain.text', ""+vendorName+""+vendorName+"")
    }

    DeleteNoteInGeneralPage(vendorName)
    {
        cy.xpath("//p[text()='"+vendorName+""+vendorName+"']").trigger('onmouseover')
        cy.xpath("//span[text()='Delete']").click({force: true})
        cy.wait(1500)
        cy.xpath("//span[text()='Confirm']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Vendor note deleted successfully!']").should('contain.text', "Vendor note deleted successfully!")
    }

    RedirectsContactsandValidateContacts()
    {
        cy.xpath("//div[text()='CONTACTS']").click()
        cy.wait(2000)
        cy.xpath("//span[text()=' ADD CONTACT']").click()
        cy.wait(2000)
        cy.xpath("//span[text()='SAVE CONTACT']").click()
        cy.wait(2000)
        cy.xpath("//mat-error[text()='First Name is required.']").should('contain.text', "First Name is required.")
        cy.xpath("//mat-error[text()='Last Name is required.']").should('contain.text', "Last Name is required.")
        cy.wait(1000)
    }
    
    AddingNewContactandvalidateNotificationandContactTable(vendorName)
    {
        cy.get('input[formcontrolname="firstName"]').click()
        cy.get('input[formcontrolname="firstName"]').type(vendorName)
        cy.get('input[formcontrolname="lastName"]').click()
        cy.get('input[formcontrolname="lastName"]').type('contact')
        cy.xpath("//span[text()='SAVE CONTACT']").click()
        cy.xpath("//span[text()='Contact created successfully!']")
        cy.wait(2000)
        cy.xpath("//a[text()=' "+vendorName+ " contact ']").should('contain.text', " "+vendorName+ " contact ")
        cy.wait(2000)
    }

    DuplicateFunctionalityOfContactsValidate(vendorName)
    {
        cy.xpath("//mat-icon[text()='more_vert']").click()
        cy.wait(1500)
        cy.xpath("//button[text()='Duplicate']").click()
        cy.wait(1000)
        cy.xpath("//span[text()='SAVE CONTACT']").click()
        cy.xpath("//span[text()='Contact created successfully!']")
        cy.wait(3500)
        cy.xpath("//a[text()=' "+vendorName+ " contact ']").eq(1).should('contain.text', " "+vendorName+ " contact ")
    }

    RedirectsAttachmentsAndValidateAttachmentValidation()
    {
        cy.xpath("//div[text()='ATTACHMENTS']").click()
        cy.wait(2000)
        cy.xpath("//span[text()='Upload']").click()
        cy.wait(1000)
        cy.xpath("//mat-error[text()='No files are selected.']").should('contain.text', "No files are selected.")
        cy.wait(1000)
    }
    
    RedirectsShppingAddressAndAddNewAddressandValidateNotification(vendorName,ShippingAddressForVendors,AddressForVendors,CityForVendors,ContactNameforVendors,PhoneNumberForVendors,EmailAddress)
    {
        cy.xpath("//div[text()='SHIPPING ADDRESS']").click()
        cy.wait(1500)
        cy.xpath("//mat-label[text()='Designator']//parent::label//parent::span//parent::div//input").click().type(vendorName)
        cy.wait(500)
        cy.xpath("//mat-label[text()='Ship to Business Name']//parent::label//parent::span//parent::div//input").click().type(ShippingAddressForVendors)
        cy.wait(500)
        cy.xpath("//mat-label[text()='Address']//parent::label//parent::span//parent::div//input").eq(1).click().type(AddressForVendors)
        cy.wait(500)
        cy.xpath("//mat-label[text()='ZIP Code']//parent::label//parent::span//parent::div//input").eq(1).click()
        cy.wait(500)
        cy.xpath("//span[text()='00501']").click()
        cy.wait(500)
        cy.xpath("//mat-label[text()='City']//parent::label//parent::span//parent::div//input").eq(1).click().type(CityForVendors)
        cy.wait(500)
        cy.xpath("//mat-label[text()='Contact Name']//parent::label//parent::span//parent::div//input").click().type(ContactNameforVendors)
        cy.wait(500)
        cy.xpath("//mat-label[text()='Phone number']//parent::label//parent::span//parent::div//input").eq(0).click().type(PhoneNumberForVendors)
        cy.wait(500)
        cy.xpath("//mat-label[text()='Email Address']//parent::label//parent::span//parent::div//input").click().type(EmailAddress)
        cy.wait(500)
        cy.xpath("//span[text()='Save']").eq(1).click()
        cy.wait(500)
        cy.xpath("//span[text()='Shipping address updated successfully!']").should('contain.text', "Shipping address updated successfully!")
    }

    FunctionalityOfDuplicateOnShippingAddressandValidate(vendorName)
    {
        cy.xpath("//span[text()=' DUPLICATE ']").click()
        cy.wait(1000)
        cy.xpath("//span[text()='Save']").eq(1).click()
        cy.wait(1500)
        cy.xpath("//span[text()='Shipping address updated successfully!']").should('contain.text', "Shipping address updated successfully!")
        cy.wait(1500)
        cy.xpath("//span[text()=' DUPLICATE ']").eq(1).should('contain.text', " DUPLICATE ")
        cy.wait(1500)
    }   

    FunctionalityOfDeleteShippingAddress()
    {
        cy.xpath("//span[text()=' DELETE']").eq(0).click()
        cy.wait(1500)    
        cy.xpath("//span[text()='Save']").eq(1).click()
        cy.wait(1500)
        cy.xpath("//span[text()='Shipping address updated successfully!']").should('contain.text', "Shipping address updated successfully!")
        cy.wait(1500)    
    }

    clickOnClient() {
        cy.get(':nth-child(2) > .tableau-link').click()
    }

    clickOnAddClient() {
        cy.get('.imx-button-stroked').click()
    }

    VerifyValidationOnClient()
    {
        cy.xpath("//span[text()='Save Client ']").click()
        cy.wait(200)
        cy.xpath("//mat-error[text()='Client Name is required.']").should('contain.text', "Client Name is required.")
        cy.wait(200)
        cy.xpath("//mat-error[text()='Client Type is required.']").should('contain.text', "Client Type is required.")
        cy.wait(200)
        cy.xpath("//mat-error[text()='Division is required.']").should('contain.text', "Division is required.")
        cy.wait(200)
        cy.xpath("//mat-error[text()='Office is required.']").should('contain.text', "Office is required.")
        cy.wait(200)
        cy.xpath("//mat-error[text()='Managed By is required.']").should('contain.text', "Managed By is required.")
        cy.wait(200)
    }

    createNewClient(clientName) {
        cy.get('input[formcontrolname="clientName"]').click()
        cy.get('input[formcontrolname="clientName"]').type(clientName)
        cy.get('input[formcontrolname="parentClient"]').click()
        cy.get('mat-option[role="option"]>span>span').contains('ARMY').click()
        cy.get('mat-select[formcontrolname="clientType"]').click()
        cy.get('mat-option[role="option"]>span').contains('OMD').click()
        cy.get('mat-select[formcontrolname="division"]').click()
        cy.get('mat-option[role="option"]>span').contains('Outdoor Media Group').click()
        cy.get('mat-select[formcontrolname="office"]').click()
        cy.get('mat-option[role="option"]>span').contains('OMA Atlanta').click()
        cy.get('input[formcontrolname="mediaAgency"]').click()
        cy.get('mat-option[role="option"]>span').contains('Acento').click()
        cy.get('mat-select[formcontrolname="agencyContact"]').click()
        cy.wait(5000)
        cy.get('mat-option[role="option"]>span').contains('Select Agency Contact').click()
        cy.get('input[formcontrolname="creativeAgency"]').click()
        cy.get('mat-option[role="option"]>span').contains('Acento').click()
        cy.get('mat-select[formcontrolname="creativeAgencyContact"]').click()
        cy.wait(20000)
        cy.get('mat-option[role="option"]>span').contains('Select Creative Agency Contact').click()
        cy.wait(200)
        cy.xpath("//mat-label[text()='Phone']//parent::label//parent::span//parent::div//input").click()
        cy.xpath("//mat-label[text()='Phone']//parent::label//parent::span//parent::div//input").type('9876543210')
        cy.wait(200)
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").click()
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").type('1235678568')
        cy.get('input[formcontrolname="companyEmail"]').click()
        cy.get('input[formcontrolname="companyEmail"]').type('mkrishnappa@intermx.com')
        cy.get('input[formcontrolname="website"]').click()
        cy.get('input[formcontrolname="website"]').type('https://omg.integration.intermx.io')
        cy.get('input[formcontrolname="address"]').eq(1).click().type('intermx')
        //cy.get('input[formcontrolname="address"]')
        cy.get('input[formcontrolname="zipCode"]').eq(1).click()
        cy.get('span[class="mat-option-text"]').contains('00501').click()
        cy.get('input[formcontrolname="managedBy"]').click()
        cy.get('mat-option[role="option"]>span').contains('Allison Chi').click()
        cy.get('span[class="mat-button-wrapper"]').contains('Save Client ').click()
        cy.xpath("//span[text()='Client created successfully!']").should('contain.text', "Client created successfully!")
    }

    UpdatetheClientValidate()
    {
        cy.get('input[formcontrolname="zipCode"]').eq(1).click()
        cy.wait(200)
        cy.get('span[class="mat-option-text"]').contains('00601').click()
        cy.wait(200)
        cy.xpath("//mat-label[text()='Media Client Code']//parent::label//parent::span//parent::div//input").type("IMD")
        cy.xpath("//mat-label[text()='Income Acct Code']//parent::label//parent::span//parent::div//input").type("IMG")
        cy.get('mat-select[formcontrolname="prdScheme"]').click()
        cy.wait(200)
        cy.xpath("//span[text()='General']").click()
        cy.wait(200)
        cy.get('mat-select[formcontrolname="estScheme"]').click()
        cy.wait(200)
        cy.xpath("//span[text()='General']").eq(1).click()
        cy.wait(200)
        cy.xpath("//span[text()='Save']").eq(1).click()
        cy.wait(200)
        cy.xpath("//span[text()='client updated successfully']").should('contain.text', "client updated successfully")
    }

    AddNoteInClientsPage(clientName)
    {
        cy.xpath("//mat-label[text()='Please enter Notes here']//parent::label//parent::span//parent::div//textarea").click()
        cy.wait(4500)
        cy.xpath("//*[@class='cke_wysiwyg_frame cke_reset']").then(function($ele)
        {
            var ifele = $ele.contents().find("body[class='cke_editable cke_editable_themed cke_contents_ltr cke_show_borders']>p")
            cy.wrap(ifele).click().type(clientName)
        })
        cy.wait(1500)
        cy.xpath("//span[text()='ADD NOTE']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Client note created successfully!']").should('contain.text', "Client note created successfully!")
    }

    ValidateEmailandNoteContentForNewlyAddedNoteInClientsPage(clientName)
    {
        cy.xpath("//p[text()='"+clientName+"']").should('contain.text', ""+clientName+"")
        cy.xpath("//p[text()='Drafted by test-keith-guerke@intermx.com']").should('contain.text', "Drafted by test-keith-guerke@intermx.com") 
    }

    EditNoteContentInClientsPageandSave(clientName)
    {
        cy.xpath("//p[text()='"+clientName+"']").trigger('onmouseover')
        cy.xpath("//span[text()='EDIT']").click({force: true})
        cy.wait(1500)
        cy.xpath("//*[@class='cke_wysiwyg_frame cke_reset']").then(function($ele)
        {
            var ifele = $ele.contents().find("body[class='cke_editable cke_editable_themed cke_contents_ltr cke_show_borders']>p")
            cy.wrap(ifele).eq(1).click().type(clientName)
        })
        cy.wait(1500)
        cy.xpath("//span[text()='save edit']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Client note updated successfully!']").should('contain.text', "Client note updated successfully!")
    }

    ValidateEmailandNoteContentForNewlyEditedNoteInClientsPage(clientName)
    {
        cy.xpath("//p[text()='Changed by test-keith-guerke@intermx.com']").should('contain.text', "Changed by test-keith-guerke@intermx.com")
        cy.xpath("//p[text()='"+clientName+""+clientName+"']").should('contain.text', ""+clientName+""+clientName+"")
    }

    DeleteNoteInClientsPage(clientName)
    {
        cy.xpath("//p[text()='"+clientName+""+clientName+"']").trigger('onmouseover')
        cy.xpath("//span[text()='Delete']").click({force: true})
        cy.wait(1500)
        cy.xpath("//span[text()='Confirm']").click()
        cy.wait(500)
        cy.xpath("//span[text()='Client note deleted successfully!']").should('contain.text', "Client note deleted successfully!")
    }

    clickOnAgencies(){
        cy.get(':nth-child(3) > .tableau-link').click()
    }

    clickOnAddAgencies(){
        cy.get('.imx-button-stroked > .mat-button-wrapper').click()
    }

    createNewAgencies(agenciesName){
        cy.get('input[formcontrolname="name"]').eq(1).click().type(agenciesName)
        //cy.get('input[formcontrolname="name"]')      
        cy.wait(2000)
        cy.get('input[formcontrolname="parentAgency"]').click()
        cy.get('mat-option[role="option"]>span').contains('ZGroup').click()
        cy.get('mat-select[formcontrolname="division"]').click()
        cy.get('mat-option[role="option"]>span').contains('Outdoor Media Group').click()
        cy.get('mat-select[formcontrolname="office"]').click()
        cy.get('mat-option[role="option"]>span').contains('OMA Atlanta').click()
        cy.get('input[formcontrolname="managedBy"]').click()
        cy.get('mat-option[role="option"]>span').contains('Alex Segall').click()
        cy.wait(200)
        cy.xpath("//mat-label[text()='Phone']//parent::label//parent::span//parent::div//input").click()
        cy.xpath("//mat-label[text()='Phone']//parent::label//parent::span//parent::div//input").type('9876543210')
        cy.wait(200)
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").click()
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").type('1235678568')
        cy.wait(2000)
        cy.get('input[formcontrolname="email"]').click()
        cy.get('input[formcontrolname="email"]').type('mkrishnappa@intermx.com')
        cy.get('input[formcontrolname="website"]').click()
        cy.get('input[formcontrolname="website"]').type('https://omg.integration.intermx.io')
        cy.get('input[formcontrolname="address"]').eq(1).click().type('intermx')
       //cy.get('input[formcontrolname="address"]')
        cy.get('input[formcontrolname="zipCode"]').eq(1).click()
        cy.wait(3000)
        cy.get('span[class="mat-option-text"]').contains('00501').click()
        cy.get('mat-select[formcontrolname="type"]').click()
        cy.get('mat-option[role="option"]>span').contains('Media Agency').click()
      
        cy.get('span[class="mat-button-wrapper"]').contains('SAVE AGENCY').click({force: true})
    }

    clickOnContact(){
        cy.get(':nth-child(4) > .tableau-link').click()
    }

    clickOnAddContact(){
        cy.get('.imx-button-stroked > .mat-button-wrapper').click()
    }

    createNewContact(contactName){
        cy.get('input[formcontrolname="firstName"]').click()
        cy.get('input[formcontrolname="firstName"]').type(contactName)
        cy.get('input[formcontrolname="lastName"]').click()
        cy.get('input[formcontrolname="lastName"]').type('contact')
        cy.get('input[formcontrolname="company"]').click()
        cy.get('mat-option[role="option"]>span>span').contains('3.0 Outdoor').click()
        cy.get('mat-select[formcontrolname="type"]').click()
        cy.get('mat-option[role="option"]>span').contains(' Accounting/Billing ').click()
        cy.get('input[formcontrolname="title"]').click()
        cy.get('input[formcontrolname="title"]').type('testContact')
        cy.get('input[formcontrolname="email"]').click()
        cy.get('input[formcontrolname="email"]').type('mkrishnappa@intermx.com')
        cy.xpath("//mat-label[text()='Mobile']//parent::label//parent::span//parent::div//input").eq(1).click()
        cy.xpath("//mat-label[text()='Mobile']//parent::label//parent::span//parent::div//input").eq(1).type('9876543210')
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").click()
        cy.xpath("//mat-label[text()='FAX']//parent::label//parent::span//parent::div//input").type('1235678568')
        cy.get('input[formcontrolname="ext"]').eq(1).click().type('12345')
        //cy.get('input[formcontrolname="ext"]')
       // cy.get('#imx-tel-input-2 > .imx-tel-input-container').eq(1).click().type('1234567890')
        //cy.get('#imx-tel-input-2 > .imx-tel-input-container')
        cy.get('input[formcontrolname="address"]').eq(1).click().type('intermx')
        //cy.get('input[formcontrolname="address"]')
        cy.get('input[formcontrolname="zipCode"]').eq(1).click()
        cy.get('span[class="mat-option-text"]').contains('00501').click()
        cy.get('span[class="mat-button-wrapper"]').contains('SAVE CONTACT').click()
    }

    clickOnExpandButton(){
        cy.get('[tooltip="Expand Table"] > .mat-icon').click()
    }

    clickOnAddNewJob(jobName, clientName){
        cy.get('.imx-button-stroked > .mat-button-wrapper').click()
        cy.get('input[formcontrolname="name"]').click()
        cy.get('input[formcontrolname="name"]').type(jobName)
        cy.get('input[formcontrolname="client"]').click()
        cy.get('input[formcontrolname="client"]').type(clientName)
        cy.get('.mat-dialog-actions > .imx-button-primary > .mat-button-wrapper').click()
    }

    deleteRecord(){
       // cy.get('.action-menu-column > .mat-icon').click()
       cy.xpath("//span[text()='Search']").click()
       cy.wait(3000)
       cy.xpath("//mat-icon[text()='more_vert']").click()
        //cy.get('[visiblitytype="delete"]').click()
        cy.wait(2000)
        //cy.get('.continue-btn').click()
        cy.xpath("//button[text()='Delete']").click()
    }

    clickOnCustomizeColumns(){
        cy.get('[tooltip="Customize Columns"] > .mat-icon > svg').click()
    }

    clickOnApplyChanges(){
        cy.get('.primary-bg').click()
    }

    clickOnResetChanges(){
        cy.get('.footer > div > .primary').click()
    }

    clickOnAddClient1() {
        cy.get('.imx-button-stroked').click()
    }

}

export default recordsManagementPage;
