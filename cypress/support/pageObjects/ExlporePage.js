/// <reference types="Cypress" />
import example from '../../fixtures/test_data.json'


class ExplorePage {
    clickExploreButton() {

        cy.get('.explore-link > .mat-icon').click()
    }

    clickOnDefineTargetTab() {

        cy.get('#define-target').click()
    }

    selectAudience(audience) {
        cy.get('#mat-expansion-panel-header-24 > .mat-expansion-indicator').click({ multiple: true });
       // cy.get('#mat-radio-2568 > .mat-radio-label').click()
        //cy.xpath("//input[@data-placeholder='Search demographics, behaviors, etc']").clear();
        cy.wait(5000)
        cy.xpath("//input[@data-placeholder='Search demographics, behaviors, etc']").click();
         cy.xpath("//input[@data-placeholder='Search demographics, behaviors, etc']").type(audience);
        cy.wait(3000)
       // cy.get('#mat-radio-49 > .mat-radio-label').click()
       cy.xpath("//span[text()='5+']").eq(0).click()
       cy.wait(3000)
        cy.get('span.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click({ multiple: true });
    }


    assignMarket(market) {
        cy.get('#mat-expansion-panel-header-0 > .mat-content > .mat-expansion-panel-header-title').click();
        cy.get('.market-options').click();
        cy.wait(3000)
      /*  console.log("selecting dma")
        cy.xpath("//span[text()='DMA']").click();
        cy.wait(2000)
        cy.xpath("//input[@class='mat-input-element mat-form-field-autofill-control ng-tns-c103-234 ng-pristine ng-valid cdk-text-field-autofill-monitored ng-touched']").click();
        cy.xpath("//input[@class='mat-input-element mat-form-field-autofill-control ng-tns-c103-234 ng-pristine ng-valid cdk-text-field-autofill-monitored ng-touched']").type(market);
        cy.wait(2000)
        cy.get('.mat-pseudo-checkbox').click();*/
        cy.get('.markets-section > .action-container > .btn-primary-color > .mat-button-wrapper').click()
        cy.wait(3000)
        cy.get('.continue-btn').click();


    }

    clickOnFilterInventoryTab() {

        cy.get('.test-filter-inventory').click()
    }

    ClickOnSpecificIDSSubMenu(){
        cy.xpath("//mat-panel-title[text()=' Specific IDs ']").click()
    }

    EnterValidandInvalidGeopathSpotIDApplyandValidate(ValidAndInvalid_GeopathIDInExplore){
            cy.xpath("//mat-panel-title[text()=' Geopath Spot ID']//parent::div//div[1]//div").type(ValidAndInvalid_GeopathIDInExplore)
            cy.xpath("//span[text()='APPLY']").eq(3).click()
            cy.xpath("//td[text()='10 ']").should('contain.text', "10 ")
            cy.xpath("//td[text()=' 2 ']").should('contain.text', " 2 ")
    }

    EnterValidandInvalidOperatorIDApplyandValidate(ValidAndInvalid_OperatorIDInExplore)
    {
        cy.xpath("//mat-panel-title[text()=' Operator Spot ID']//parent::div//div[1]//div").type(ValidAndInvalid_OperatorIDInExplore)
        cy.wait(2000)
    }
    InvalidIDsShowinListandSortIDsandCloseInvalidIDListpopup()
    {
        cy.xpath("//a[text()='Show in List ]']").eq(1).click()
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', "002")
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', "001")
        cy.wait(2000)
        cy.xpath("//span[text()=' Close']").click()
    }

    RemoveInvalidIDandValidateInInvalidIDsCount()
    {
        cy.wait(2000)
        cy.xpath("//a[text()='[ Remove | ']").eq(1).click()
        cy.wait(2000)
        cy.xpath("//td[@class='invalid-ids']").eq(1).should('contain.text', " 0 ")
        cy.wait(2000)
    }

    ValidIDsShowinListandSortIDsandCloseVvalidIDListpopup()
    {
        cy.wait(2000)
        cy.xpath("//a[text()='[Show in List]']").click()
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', " 30799624 ")
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', " 30774534 ")
        cy.wait(2000)
        cy.xpath("//span[text()=' Close']").click()
    }

    ValidateGeopathIDsInSpotSummayListpage()
    {
        cy.xpath("//div[@class='e2e-inventory-count ng-star-inserted']").should('contain.text', " 10  selected of 10 Spots in filter ")
        cy.wait(2000)

        cy.xpath("//p[contains(text(),'Geopath Spot ID:')]").each(($e,index,$list) => {
            const text = $e.text()
            cy.log(text)     
            if(text.includes("Geopath Spot ID: 30799624"))
            {
                cy.log("Geopath Spot ID 1 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30785060"))
            {
                cy.log("Geopath Spot ID 2 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30785057"))
            {
                cy.log("Geopath Spot ID 3 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30774548"))
            {
                cy.log("Geopath Spot ID 4 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30774547"))
            {
                cy.log("Geopath Spot ID 5 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30774543"))
            {
                cy.log("Geopath Spot ID 6 Validated Successfully")
            }    
            if(text.includes("Geopath Spot ID: 30774542"))
            {
                cy.log("Geopath Spot ID 7 Validated Successfully")
            }  
            if(text.includes("Geopath Spot ID: 30774538"))
            {
                cy.log("Geopath Spot ID 8 Validated Successfully")
            }      
            if(text.includes("Geopath Spot ID: 30774537"))
            {
                cy.log("Geopath Spot ID 9 Validated Successfully")
            }  
            if(text.includes("Geopath Spot ID: 30774534"))
            {
                cy.log("Geopath Spot ID 10 Validated Successfully")
            }      
        })    
    }

    EnterValidOperatorsIDApplyandValidate(Valid_OperatorIDInExplore)
    {
        cy.xpath("//mat-panel-title[text()=' Operator Spot ID']//parent::div//div[1]//div").click()
        cy.wait(2000)
        cy.xpath("//mat-panel-title[text()=' Operator Spot ID']//parent::div//div[1]//div").type(Valid_OperatorIDInExplore)
        cy.wait(4000)
        cy.xpath("//span[text()='APPLY']").eq(3).click()
        cy.xpath("//td[text()='5 ']").should('contain.text', "5 ")
    }

ValidIDsShowinListandSortOperatorIDsandCloseVvalidIDListpopup()
    {
        cy.wait(2000)
        cy.xpath("//a[text()='[Show in List]']").click()
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', " 5624F ")
        cy.wait(2000)
        cy.xpath("//div[text()=' ID #']").click()
        cy.wait(2000)
        cy.xpath("//td[@class='mat-cell cdk-cell cdk-column-ids mat-column-ids ng-star-inserted']").eq(0).should('contain.text', " 5624B ")
        cy.wait(2000)
        cy.xpath("//span[text()=' Close']").click()
    }


ValidateOperatorIDsInSpotSummayListpage()
    {
        cy.xpath("//div[@class='e2e-inventory-count ng-star-inserted']").should('contain.text', " 5  selected of 5 Spots in filter ")
        cy.wait(2000)

        cy.xpath("//p[contains(text(),'Operator Spot ID:')]").each(($e,index,$list) => {
            const text = $e.text()
            cy.log(text)     
           if(text.includes("Operator Spot ID: 5624F"))
            {
                cy.log("Operator Spot ID 1 Validated Successfully")
            }    
            if(text.includes("Operator Spot ID: 5624E"))
            {
                cy.log("Operator Spot ID 2 Validated Successfully")
            }    
            if(text.includes("Operator Spot ID: 5624D"))
            {
                cy.log("Operator Spot ID 3 Validated Successfully")
            }    
            if(text.includes("Operator Spot ID: 5624C"))
            {
                cy.log("Operator Spot ID 4 Validated Successfully")
            }    
            if(text.includes("Operator Spot ID: 5624B"))
            {
                cy.log("Operator Spot ID 5 Validated Successfully")
            }    
        })    
    }

    DownloadCSVandValidatingInprogressCSV()
    {
        cy.xpath("//span[text()=' Select ']").click()
        cy.wait(2000)
        cy.xpath("//a[text()='Download CSV']").click()
        cy.wait(6000)
        cy.xpath("//span[text()='CLEAR ALL SPOT IDS']").click()
        cy.wait(2000)
        cy.xpath("//input[@class='mat-input-element mat-form-field-autofill-control mat-chip-input cdk-text-field-autofill-monitored empty']").should('contain.text', "")
        cy.wait(5000)
    }


    DownloadAsPdfandValidatingInprogressPDFandRecentlyCompletedandOpenPDFinNewtab(){
        cy.xpath("//span[text()=' Select ']").click()
        cy.wait(2000)
        cy.xpath("//a[text()='Download as PDF']").click()
        cy.wait(1500)
        cy.xpath("//span[text()=' EXPORT ']").click()
        cy.wait(1500)
        cy.xpath("//span[text()='OK']").click()
        cy.wait(2000)
        cy.xpath("//mat-icon[text()='notifications']//parent::div").click()
        cy.wait(2000)
        cy.xpath("//h6[text()=' PDF ']").should('contain.text', " PDF ")
        cy.wait(400000)
        cy.xpath("//a[text()=' Download PDF ']").should('contain.text', " Download PDF ").click()
        cy.wait(4000)
        cy.xpath("//span[text()='CLEAR ALL SPOT IDS']").click()
        cy.wait(2000)
        cy.xpath("//input[@class='mat-input-element mat-form-field-autofill-control mat-chip-input cdk-text-field-autofill-monitored empty']").should('contain.text', "")
        cy.wait(2000)
    }

    clickOnSpecificIdTab() {
       // cy.get('#mat-expansion-panel-header-42')
       cy.xpath("//mat-panel-title[text()='Place Sets']//parent::span//parent::mat-expansion-panel-header")
    }
    inputGeopathSpotId(GeopathSpotId) {
        cy.wait(2000)
        cy.xpath("//mat-label[text()='PASTE OR TYPE IDS HERE']//parent::div//input").eq(0).clear()
        cy.wait(3000)
        cy.xpath("//mat-label[text()='PASTE OR TYPE IDS HERE']//parent::div//input").eq(0).type(GeopathSpotId)

    }

    clickApply() {

        cy.get('.mat-accordion > .action-container > .btn-primary-color > .mat-button-wrapper').click()
    }
}

export default ExplorePage;