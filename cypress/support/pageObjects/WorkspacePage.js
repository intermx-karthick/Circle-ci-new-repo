

class WorkspacePage {


    generate_random_string() {
        cy.wait(1500)
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `cypress-automation${id}`
        return testname;
        cy.wait(1500)
    }

    saveAsScenarioRandom() {
        const uuid = () => Cypress._.random(0, 1e6)
        const id = uuid()
        const testname = `automation${id}`
        return testname;
    }

    clickOnworkspace() {
       cy.get("a[mattooltip='Workspace']").click()
    }

    createNewProject(campName) {
       // cy.get('.imx-button-stroked > .mat-button-wrapper').eq(1).click();
       /*cy.get("span[class='mat-button-wrapper']").each(($e,index,$list) => {
        const text1 = $e.text()
       // cy.log(text)    
        if(text1.includes("Add Project"))
        {
            cy.get("span[class='mat-button-wrapper']").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
        }) */
        cy.wait(3000)
        cy.xpath("//span[text()='Add Project']").click()

        //cy.get('#mat-input-0').clear();
        //cy.get('#mat-input-0').type(campName);

        //cy.get("label[id='mat-form-field-label-29']>mat-label").parent(".mat-form-field-label-wrapper").parent(".mat-form-field-infix>input").type("AAA")
        cy.wait(3000)
        cy.get("input[formcontrolname='name']").eq(1).clear();
        cy.get("input[formcontrolname='name']").eq(1).type(campName);
   
        //cy.get('[maxlength="320"]').clear()
        //cy.get('[maxlength="320"]').type(campName)
        cy.wait(3000)
        cy.get("textarea[formcontrolname='description']").clear()
        cy.get("textarea[formcontrolname='description']").type(campName)
        
        //cy.get('.imx-button-primary > .mat-button-wrapper').click();

        const text = cy.get("span[class^='mat-button-wrapper']").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("Create Project"))
            {
                cy.get("span[class^='mat-button-wrapper']").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    

        cy.wait(6000)
    }
    logout(){
        cy.wait(4000)
        cy.xpath("//span[text()='TT']").click({ multiple: true })
        cy.wait(200)
        cy.xpath("//a[text()='Log Out']").click()
    }

    clickOnAddPlan() {
       // cy.get('.actions > .mat-focus-indicator > .mat-button-wrapper').click();

       cy.get(".mat-button-wrapper").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes(" Add Plan "))
        {
            cy.get(".mat-button-wrapper").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })    
    }

    clickOnInventoryPlan() {
       // cy.get('[aria-label="inventoryPlan"]').click();
       cy.get(".mat-tab-label-content").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes("INVENTORY PLAN"))
        {
            cy.get(".mat-tab-label-content").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })    
        cy.wait(3000)
    }

    SelectInventoryandClickAttributesandSelectsMurals()
    {
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()
        cy.wait(1000)
        cy.xpath("//div[text()='SELECT ATTRIBUTES']").click()
        cy.wait(3000)
        cy.xpath("//mat-panel-title[text()=' Media & Placement ']").click()
        cy.wait(2000)
        cy.xpath("//mat-panel-title[text()=' Media Type ']").click()
        cy.wait(2000)
        cy.xpath("//div[text()=' Murals ']").click()
        cy.wait(2000)
        cy.xpath("//span[text()='Add Selected']").click()
        cy.wait(2000)
        cy.xpath("//button[text()='Add Selected as Individual']").click()
        cy.wait(200)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(2000)
    }

    ValidateInventoryMediatypesandThresholdsandGenerate()
    {
        cy.xpath("//li[text()='Murals ']").should('contain.text', "Murals ")
        cy.wait(2000)
        cy.xpath("//div[text()='50 - 1k ']").should('contain.text', "50 - 1k ")
        cy.wait(1000)
        cy.xpath("//div[text()='0 - 150k ']").should('contain.text', "0 - 150k ")
        cy.wait(1000)
        cy.xpath("//span[text()=' Generate ']").click()
    }

    ClickGeneratedScenarioNameandSaveAsInventorySet(campName)
    {
        cy.xpath("//span[@class='primary-color-text']").click()
        cy.wait(5000)
        cy.xpath("//mat-icon[text()=' keyboard_arrow_down ']").click()
        cy.wait(6000)
        cy.xpath("//span[@class='mat-checkbox-inner-container mat-checkbox-inner-container-no-side-margin']").eq(1).click()
        cy.wait(3000)
        cy.xpath("//mat-icon[@data-mat-icon-name='IMX-save-inventoryset']").click()
        cy.wait(6000)
        cy.xpath("//mat-label[text()='Inventory set Name']//parent::label//parent::span//parent::div//input").click().type(campName)
        cy.wait(6000)
        cy.xpath("//span[text()='SAVE']").eq(1).click()
        cy.wait(500)
        cy.xpath("//span[text()='Your Inventory Set saved successfully.']").should('contain.text', "Your Inventory Set saved successfully.")
        cy.wait(3000)
    }

    SavedInventorySetvalidateintheInventorySetpopup(campName)
    {
        cy.wait(2000)
        cy.xpath("//mat-icon[text()='arrow_back']").click()
        cy.wait(4000)
        cy.get(".mat-button-wrapper").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes(" Add Plan "))
            {
                cy.get(".mat-button-wrapper").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    

        cy.get(".mat-tab-label-content").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("INVENTORY PLAN"))
            {
                cy.get(".mat-tab-label-content").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })   
        cy.wait(6000)
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()
        cy.wait(3000)
        cy.xpath("//div[text()='INVENTORY SET']").click()
        cy.wait(3000)
        cy.xpath("//span[text()='"+campName+"']").should('contain.text', ""+campName+"")
        cy.wait(3000)
    }

    ApplyNewlySaveInventorySetandGeneratePlan(campName)
    {
        cy.xpath("//span[text()='"+campName+"']").click()
        cy.wait(1000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(2000)
        cy.xpath("//span[text()=' Add as individual']").click()       
        cy.wait(3000)
        cy.xpath("//span[text()=' Generate ']").click()
        cy.wait(5000)
    }

    ValidateNewlySavedInventorySetValueswithExistingScenarioValues()
    {
        cy.xpath("//span[@class='primary-color-text']").eq(1).click()
        cy.wait(3000)
        cy.xpath("//mat-icon[text()=' keyboard_arrow_down ']").click()
        cy.wait(6000)
        //const GetOperatorName = cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(0).text()
        //cy.log(GetOperatorName)
        cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(0).each(($e,index,$list) => {
            const GetOperatorName = $e.text()
            cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(1).each(($e,index,$list) => {
                const GetGeopathSpotID = $e.text()
                cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(2).each(($e,index,$list) => {
                    const GetGeopathFrameIDD = $e.text()
                    cy.log(GetOperatorName)
                    cy.log(GetGeopathSpotID)
                    cy.log(GetGeopathFrameIDD)
                    cy.wait(4000)
                    cy.xpath("//mat-icon[text()='arrow_back']").click()
                    cy.wait(6000)
                    cy.xpath("//span[@class='primary-color-text']").eq(0).click()
                    cy.wait(3000)
                    cy.xpath("//mat-icon[text()=' keyboard_arrow_down ']").click()
                    cy.wait(6000)
                    cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(0).each(($e,index,$list) => {
                        const GetOperatorNameOnSavedInventorySet =  $e.text()
                        if(GetOperatorNameOnSavedInventorySet.includes(GetOperatorName))
                        {
                            cy.log("Operator Name validated Successfully")   
                            cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(1).each(($e,index,$list) => {
                        const GetGeopathIDSavedInventorySet =  $e.text()
                        if(GetGeopathIDSavedInventorySet.includes(GetGeopathSpotID))
                        {
                            cy.log("Geopath Spot ID validated Successfully")   
                            
                        }
                            })
                            cy.xpath("//mat-cell[@class='mat-cell cdk-cell cdk-column-checked mat-column-checked ng-star-inserted mat-table-sticky mat-table-sticky-border-elem-left']/following-sibling::mat-cell").eq(2).each(($e,index,$list) => {
                                const GetFrameIDSavedInventorySet =  $e.text()
                                if(GetFrameIDSavedInventorySet.includes(GetGeopathFrameIDD))
                                {
                                    cy.log("Frame ID validated Successfully")   
                                    
                                }
                            })
                        }
                    })
                })
            })
        })
    }

    selectAudience(audience) {
        cy.wait(6000)
        cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
      /*  cy.get("span[class='mat-button-wrapper']>span").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("AUDIENCE (1)"))
            {
                cy.get("span[class='mat-button-wrapper']>span").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    */
        cy.wait(6000)
        //cy.get('[placeholder="Search demographics, behaviors, etc"]').clear();
        //cy.get('[placeholder="Search demographics, behaviors, etc"]').click({ multiple: true });
        //cy.get('[placeholder="Search demographics, behaviors, etc"]').type(audience);

        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').clear();
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').click({ multiple: true });
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').type(audience);

        cy.wait(3000)
        cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click(5, 60, { force: true })
        //cy.get('.apply-btn cursor-link').click(5, 60, { force: true });
        cy.wait(2000)
        //cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click();
        cy.get("span[class='mat-button-wrapper']").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("ADD SELECTED "))
            {
                cy.get("span[class='mat-button-wrapper']").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    
       // cy.xpath("//span[text()='ADD SELECTED ']").click()
    }

    selectMarket(market) {
        cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').click();
        cy.get('.mat-list-text').click();
        cy.wait(3000)
        console.log("selecting dma")
        cy.get('[aria-label="DMA"]').click();
        //cy.get('[placeholder="ENTER KEYWORD"]').clear();
        //cy.get('[placeholder="ENTER KEYWORD"]').type(market);

        cy.get('[data-placeholder="ENTER KEYWORD"]').clear();
        cy.get('[data-placeholder="ENTER KEYWORD"]').type(market);

        cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        cy.get(':nth-child(4) > .mat-button-wrapper').click();


        //cy.get(':nth-child(3) > .mat-button-wrapper').click();


    }

    selectMarketForInventoryPlan(market) {
        cy.get(':nth-child(2) > .mat-focus-indicator > .mat-button-wrapper > span').click();
       /*  cy.get("span[class='mat-button-wrapper']>span").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("MARKETS (1)"))
            {
                cy.get("span[class='mat-button-wrapper']>span").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    */

       // cy.get('.mat-list-text').click();
     /*  cy.get("div[class='mat-list-text']>span").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes("MARKETS (1)"))
        {
            cy.get("div[class='mat-list-text']>span").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    }) */   
        cy.wait(3000)
        console.log("selecting dma")
        cy.get('[aria-label="DMA"]').click();
        //  cy.get('#mat-input-11').clear();
        //  cy.get('#mat-input-11').type(market);
        cy.get(':nth-child(1) > .mat-list-item-content > .mat-list-text > span').click();
        //  cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        //cy.get(':nth-child(4) > .mat-button-wrapper').click();
        
        cy.get(".mat-button-wrapper").each(($e,index,$list) => {
            const text = $e.text()
          //  cy.log(text)    
            if(text.includes("ADD AS INDIVIDUAL "))
            {
                cy.get(".mat-button-wrapper").eq(index).then(function(bname)
                {
                    bname.click()
                })
            }
        })    
        
        cy.wait(4000)
       // cy.get('.continue-btn > .mat-button-wrapper').click();

       cy.get(".mat-button-wrapper").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes("Yes"))
        {
            cy.get(".mat-button-wrapper").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })    

        //cy.get(':nth-child(3) > .mat-button-wrapper').click();


    }
    selectOperator(lamar) {
        cy.wait(3000)
        cy.get(':nth-child(3) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({multiple : true});
      /* cy.get(".mat-button-wrapper>span").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes("OPERATORS (0)"))
        {
            cy.get(".mat-button-wrapper>span").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
        })    */

        //cy.get('.modal-body-imx > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').clear()
        //cy.get('.modal-body-imx > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').type(lamar)
        cy.get("input[data-placeholder='Enter keyword']").clear()
        cy.get("input[data-placeholder='Enter keyword']").type(lamar)
        cy.wait(4000)
        cy.get('.mat-pseudo-checkbox').click()
        //cy.get(':nth-child(2) > .mat-list-item-content > .mat-pseudo-checkbox').click();
       // cy.get('[title="Add the selected operators to the filters."] > .mat-button-wrapper').click();
       cy.get(".mat-button-wrapper").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes(" Add Selected "))
        {
            cy.get(".mat-button-wrapper").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })    
       // cy.get(':nth-child(3) > .mat-button-wrapper').click()
       cy.get(".mat-button-wrapper").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes(" APPLY SELECTIONS "))
        {
            cy.get(".mat-button-wrapper").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })    
    }

    selectMedia() {
        console.log("clicking on media + button")
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click();
        cy.wait(3000)
        //cy.get('#mat-expansion-panel-header-8 > .mat-content > .mat-expansion-panel-header-title').click();
        cy.xpath("//mat-panel-title[text()=' Media & Placement ']").click()
        cy.wait(200)
        //cy.get('#mat-expansion-panel-header-13 > .mat-content > .mat-expansion-panel-header-title').click();
        cy.xpath("//mat-panel-title[text()=' Media Type ']").click()
        cy.wait(200)
        //cy.get('app-media-type-filter-w3 > .mat-selection-list > :nth-child(5) > .mat-list-item-content > .mat-list-text > .width100').click()
        cy.xpath("//div[text()=' Junior Poster ']").click()
        cy.wait(2000)
        // cy.get('#mat-expansion-panel-header-0 > .mat-content > .mat-expansion-panel-header-title').click();
        //  cy.get('#mat-expansion-panel-header-5 > .mat-content > .mat-expansion-panel-header-title').click();
        //  cy.get('app-media-type-filter-w3 > .mat-selection-list > :nth-child(5) > .mat-list-item-content > .mat-list-text > .width100').click();
        //cy.get('[title="Add the selected media types to the filters."] > .mat-button-wrapper').click();
        cy.xpath("//span[text()='Add Selected']").click()
        cy.wait(200)
        cy.xpath("//button[text()='Add Selected as Individual']").click()
        cy.wait(200)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click({force: true})
        cy.wait(1000)
    }


    selectInventory(New_York_Murals) {
        console.log("clicking on media + button")
        
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()

        //cy.get("[aria-label='INVENTORY_SET']").click()
        cy.xpath("//div[text()='INVENTORY SET']").click()
        cy.wait(2000)
       /* cy.get('.list-panel > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').clear()
        cy.wait(2000)
        cy.get('.list-panel > .mat-form-field > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').type(New_York_Murals)*/
        cy.xpath("//input[@data-placeholder='Search Saved Inventory Sets']").clear()
        cy.xpath("//input[@data-placeholder='Search Saved Inventory Sets']").type(New_York_Murals)
        cy.wait(6000)
        cy.get('.mat-pseudo-checkbox').click({ multiple: true })
        cy.wait(2000)
       // cy.get(':nth-child(3) > .mat-button-wrapper').click({ multiple: true })
       cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(2000)
        cy.get('.alignbutton > :nth-child(2)').click();
      //  cy.get('span').contains(' APPLY SELECTIONS ').click();

        // cy.get(':nth-child(3) > .mat-button-wrapper > .mat-icon').click()
        // cy.wait(3000)

    }

    Submit15ValidGeopathIDandValidateInSummary(Valid_GeopathID) {
        cy.wait(3000)
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()  
        cy.wait(3000)
        cy.xpath("//mat-panel-title[text()=' Geopath Spot ID ']").click()
        cy.wait(2000)
        cy.xpath("//mat-hint[text()='PLEASE ADD SPOT IDS WITH NUMBERS ALONE']//parent::app-imx-tag-input//div[2]//input").click()
        cy.xpath("//mat-hint[text()='PLEASE ADD SPOT IDS WITH NUMBERS ALONE']//parent::app-imx-tag-input//div[2]//input").type(Valid_GeopathID);
        cy.wait(2000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(2000)
        cy.xpath("//span[text()=' Add as individual']").click()       
        cy.wait(3000)
        cy.xpath("//div[text()=' 15 Spot ID(s) ']").should('contain.text', " 15 Spot ID(s) ")
        cy.wait(4000)
    }

    Submit5ValidOperatorIDandValidateInSummary(Valid_OperatorID)
    {
        cy.wait(3000)
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()  
        cy.wait(3000)
        cy.xpath("//mat-panel-title[text()=' Operator Spot ID ']").click()
        cy.wait(4000)
        cy.xpath("//input[@placeholder='Paste or type IDs here']").eq(1).click()
        cy.xpath("//input[@placeholder='Paste or type IDs here']").eq(1).type(Valid_OperatorID)
        cy.wait(5000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(4000)
        cy.xpath("//span[text()=' Add as individual']").click()       
        cy.wait(4000)
        cy.xpath("//div[text()=' 5 Spot ID(s) ']").should('contain.text', " 5 Spot ID(s) ")
        cy.wait(4000)
    }

    Submit10Invalidand5ValidGeopathIDandValidateInSummary(InvalidandValid_GeoPathID){
        cy.wait(3000)
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()  
        cy.wait(3000)
        cy.xpath("//mat-panel-title[text()=' Geopath Spot ID ']").click()
        cy.wait(2000)
        cy.xpath("//mat-hint[text()='PLEASE ADD SPOT IDS WITH NUMBERS ALONE']//parent::app-imx-tag-input//div[2]//input").click()
        cy.xpath("//mat-hint[text()='PLEASE ADD SPOT IDS WITH NUMBERS ALONE']//parent::app-imx-tag-input//div[2]//input").type(InvalidandValid_GeoPathID);
        cy.wait(2000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(1000)
        const text = cy.get('.mat-simple-snackbar>span').each(($e,index,$list) => {
            const text = $e.text()
            cy.log(text)    
            if(text.includes("Some Geopath IDs you’ve entered are invalid, please try again."))
            {
               cy.log("Invalid Geopath validated sucessfully")
            }
        })
       // cy.get('.mat-simple-snackbar>span').should('contain.text', "Some Geopath IDs you've entered are invalid, please try again.")
        cy.wait(2000)
    }

    Submit5Invalidand5validOperatorIDandValidateInSummary(InValid_OperatorID)
    {
        cy.wait(3000)
        cy.get(':nth-child(4) > .mat-focus-indicator > .mat-button-wrapper > span').click()  
        cy.wait(3000)
        cy.xpath("//mat-panel-title[text()=' Operator Spot ID ']").click()
        cy.wait(4000)
        cy.xpath("//input[@placeholder='Paste or type IDs here']").eq(1).click()
        cy.xpath("//input[@placeholder='Paste or type IDs here']").eq(1).type(InValid_OperatorID)
        cy.wait(5000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(1000)
        const text = cy.get('.mat-simple-snackbar>span').each(($e,index,$list) => {
            const text = $e.text()
            cy.log(text)    
            if(text.includes("Some Operators IDs you’ve entered are invalid, please try again."))
            {
               cy.log("Invalid Operators ID validated sucessfully")
            }
        })
       // cy.get('.mat-simple-snackbar>span').should('contain.text', "Some Geopath IDs you've entered are invalid, please try again.")
        cy.wait(2000)
    }

    RemoveInvalidGeopathIdAndApplywithValidIdandValidateInSummary(){
        cy.wait(3000)
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("123"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("456"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("789"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("101"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("112"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("131"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("141"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("151"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("167"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("171"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.wait(2000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(1000)
        cy.xpath("//span[text()=' Add as individual']").click()       
        cy.wait(3000)
        cy.xpath("//div[text()=' 20 Spot ID(s) ']").should('contain.text', " 20 Spot ID(s) ")
        cy.wait(4000)
    }

    RemoveInvalidOperatorIdAndApplywithValidIdandValidateInSummary()
    {
        cy.wait(3000)
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("AA"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("BB"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("CC"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("DD"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })
        cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//span[1]").each(($e,index,$list) => {
            const text = $e.text()
            if(text.includes("EE"))
            {
                cy.xpath("//mat-icon[text()='highlight_off']//parent::mat-chip//mat-icon").eq(index).click()
            }
        })   

        cy.wait(2000)
        cy.xpath("//span[text()=' APPLY SELECTIONS ']").click()
        cy.wait(1000)
        cy.xpath("//span[text()=' Add as individual']").click()       
        cy.wait(3000)
        cy.xpath("//div[text()=' 10 Spot ID(s) ']").should('contain.text', " 10 Spot ID(s) ")
        cy.wait(4000)
    }

    GenerateInventoryPlanAndValidateUnitScenarioNameinNotificationandredirectsToInventoryPlan()
     {
            cy.wait(3000)
            cy.xpath("//span[text()=' Generate ']").click()
            cy.wait(5000)
            cy.xpath("//span[text()='*Generating*']").contains('*Generating*')
            cy.wait(2000)

            cy.xpath("//span[@class='primary-color-text']").each(($e,index,$list) => {
                const text = $e.text()
                cy.log("IS"+text)
                cy.wait(500)
                cy.xpath("//mat-icon[text()='notifications']//parent::div").click()
                cy.wait(1000)
                cy.xpath("//h6[text()=' "+text+" ']").should('contain.text', " "+text+" ")
                cy.wait(10000)
                cy.xpath("//td[text()='20']").should('contain.text', "20")
                cy.wait(2000)
                cy.xpath("//h6[text()=' "+text+" ']//parent::div//span").should('contain.text', " Inventory Plan - 20 unit(s) found ")
                cy.wait(2000)
                cy.xpath("//h6[text()=' "+text+" ']").click()
                cy.wait(5000)
             })
    }

    GenerateInventoryPlanAndValidateUnitScenarioNameinNotificationandredirectsToInventoryPlanusingOperatorID()
    {
        cy.wait(3000)
            cy.xpath("//span[text()=' Generate ']").click()
            cy.wait(5000)
            cy.xpath("//span[text()='*Generating*']").contains('*Generating*')
            cy.wait(2000)

            cy.xpath("//span[@class='primary-color-text']").each(($e,index,$list) => {
                const text = $e.text()
                cy.log("IS"+text)
                cy.wait(500)
                cy.xpath("//mat-icon[text()='notifications']//parent::div").click()
                cy.wait(1000)
                cy.xpath("//h6[text()=' "+text+" ']").should('contain.text', " "+text+" ")
                cy.wait(10000)
                cy.xpath("//td[text()='10']").should('contain.text', "10")
                cy.wait(2000)
                cy.xpath("//h6[text()=' "+text+" ']//parent::div//span").should('contain.text', " Inventory Plan - 10 unit(s) found ")
                cy.wait(2000)
                cy.xpath("//h6[text()=' "+text+" ']").click()
                cy.wait(5000)
             })
    }

    typeScenarioName(campName) {
        /*cy.get(':nth-child(3) > .mat-button-wrapper').click();
        cy.get('#mat-input-3').clear();
        cy.get('#mat-input-3').type(campName);*/

        cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").click()
           cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").clear()
           cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").type(campName)


           cy.get("input[id^='mat-input-'][formcontrolname='description']").click();
           cy.get("input[id^='mat-input-'][formcontrolname='description']").clear();
           cy.get("input[id^='mat-input-'][formcontrolname='description']").type(campName);
        

        /*cy.get('.mat-form-field-hide-placeholder > .mat-form-field-wrapper > .mat-form-field-flex > .mat-form-field-infix').click({ multiple: true });
        cy.get('#mat-input-4').clear();
        cy.get('#mat-input-4').type(campName);*/
    }

    typeInventoryScenarioName(campName) {
        //cy.get('#mat-input-6').click();
        //cy.get('#mat-input-6').clear();
        //cy.get('#mat-input-6').type(campName);

         //  cy.get("input[id^='mat-input-'][formcontrolname='name']").eq(1).click();
          // cy.get("input[id^='mat-input-'][formcontrolname='name']").eq(1).clear();
           cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").click()
           cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").clear()
           cy.xpath("//mat-label[text()='Scenario Name (Optional)']//parent::label//parent::span//parent::div/input").type(campName)

         //  cy.get('#mat-input-7').clear();
       // cy.get('#mat-input-7').type(campName);

           cy.get("input[id^='mat-input-'][formcontrolname='description']").click();
           cy.get("input[id^='mat-input-'][formcontrolname='description']").clear();
           cy.get("input[id^='mat-input-'][formcontrolname='description']").type(campName);
    }

    clickOnGenerateButton() {
       // cy.get('[fxlayout="row"] > .mat-focus-indicator').click();
       cy.get("button[type='submit']").click()
        //cy.wait(35000)
    }
    clickOnCustomizeColumns() {
        cy.get('[fxflex="80"] > :nth-child(2) > .mat-icon > svg').click()
    }
    clickOnExport() {
        cy.get('.scenario-export-btn > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click();
        cy.wait(5000)
        // cy.get('.mat-menu-content > .mat-focus-indicator').click();
        cy.get('.mat-menu-content > .mat-focus-indicator > span').click({force : true});
        cy.wait(5000)
    }

    clickOnActionButton() {
     //   cy.get('.action-btn-marign-right > .mat-button-wrapper > .mat-icon').click();
     cy.xpath("//span[text()='ACTIONS']").click()
     cy.wait(2000)
    }

    selectGenerateInventoryPlan() {
      //  cy.get('.mat-menu-content > :nth-child(3)').click();
      cy.xpath("//button[text()='Generate Inventory Plan']").click()
    }

    clickOnParametersIcon() {
        cy.get('.mat-icon[tooltip="Parameters"]').click();
    }

    clickOnAudienceInParameters(audience) {
      //  cy.get('.mat-expansion-panel-header>span>mat-panel-title').contains(' Audience ').click();
     // cy.get('.mat-icon[svgicon="IMX-accordion-down"]').click({ multiple: true }).eq[1]
    // cy.get('#mat-expansion-panel-header-24 > .mat-content > .mat-expansion-panel-header-description').click()
   
    
    const text = cy.get("[id*='mat-expansion-panel-header-']").each(($e,index,$list) => {
        const text = $e.text()
        //cy.log(text)    
        if(text.includes("Audience"))
        {
            cy.get("[id*='mat-expansion-panel-header-']").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
    })
    
    

    //cy.get("[id='mat-expansion-panel-header-1']").click() 


        //cy.get('#mat-input-30').clear();
        //cy.get('#mat-input-30').type(audience);

        cy.get("input[data-placeholder='Search demographics, behaviors, etc']").clear();
        cy.get("input[data-placeholder='Search demographics, behaviors, etc']").type(audience);

        cy.wait(3000)
        cy.get('.mat-selection-list > :nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click()
        cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click({ multiple: true });
    }

    clickOnDataSource2021InMapView(){
        cy.wait(4000)
        cy.get('.data-source-title').click()
        cy.get(':nth-child(2) > .mat-list-item-content > .mat-list-text > .action-item > div').click()
        cy.wait(3000)
        //cy.get('.imx-button-primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='Apply']").click()
    }

    clickOnPlanPeriod() {
       // cy.get('#mat-expansion-panel-header-18 > .mat-content > .mat-expansion-panel-header-title').click();
        cy.get("[id*='mat-expansion-panel-header-']").eq(2).click()

        cy.wait(2000)
       // cy.get('#mat-select-8 > .mat-select-trigger > .mat-select-value').click();
       //cy.get("div[id*='mat-select-value-']").eq(1).click();
       cy.get("span[class='mat-button-wrapper']").each(($e,index,$list) => {
        const text = $e.text()
      //  cy.log(text)    
        if(text.includes(" Plan Period "))
        {
            cy.get("span[class='mat-button-wrapper']").eq(index).then(function(bname)
            {
                bname.click()
            })
        }
     })    

        cy.wait(3000)
       // cy.get('mat-option').contains('2 weeks').click()
       cy.xpath("//mat-select[@formcontrolname='duration']").click()
       cy.xpath("//span[text()='2 weeks']").click()
    }

    clickOnReGenerateButton() {
      // cy.get('[fxlayout="row"] > .imx-button-primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='RE-GENERATE']").click()
    }

    clickOnNotificationButton() {
        cy.get('[role = "progressbar"]').click({ force: true });
    }

    clickOnCancelNotificationButton() {
        cy.get('.notifications-title > .mat-icon').click();
    }

    clickOnFirstInventoryPlanInNotification(campName) {
        //cy.wait(30000)
        //cy.get(':nth-child(5) > .notifications-v3 > .notifications-list > :nth-child(1) > .notification-item-content > div.ng-star-inserted > div > .notifications-v3__plan-title').click({ multiple: true });
        //cy.xpath("//mat-icon[text()='notifications']").click()
        cy.wait(5000)
        cy.xpath("//h6[text()=' "+campName+" ']").click()
    }

    clickOnTypeFilter() {
        //cy.get('.cdk-column-type > .mat-sort-header-container > .mat-sort-header-button > .header-search__label > .mat-icon > svg').click();
        cy.xpath("//mat-icon[text()=' keyboard_arrow_down ']").click()
        //cy.get(':nth-child(2) > .mat-list-item-content > .mat-pseudo-checkbox').click();
        cy.wait(10000)
        cy.xpath("//input[@type='checkbox']//parent::span//parent::label").eq(2).click()
        //cy.get('.imx-button-basic_icon').click();
        cy.go('back')
        cy.wait(5000)
        cy.xpath("//mat-icon[@svgicon='IMX-filter']").eq(0).click()
        cy.xpath("//span[text()='Inventory Plan']").click()
        cy.xpath("//span[text()='APPLY']").click()
    }

    deleteCreatedProject() {
        cy.wait(2000)
       // cy.get('[class = "caption back-to-project ng-star-inserted"]').click();
       cy.xpath("//a[text()='Back to Projects ']").click()
        cy.wait(2000)
        cy.get('[style="display: block;"] > .imx-table-container > .mat-table > tbody > :nth-child(1) > .action-menu-column > .mat-icon')
            .click();
        cy.wait(2000)
        //cy.get('.mat-menu-content > :nth-child(2)').click();
        cy.xpath("//button[text()='Delete']").click()
        cy.wait(2000)
       // cy.get('.continue-btn').click();
       cy.xpath("//span[text()='Confirm']").click()

        cy.get('.mat-simple-snackbar > :nth-child(1)').should('contain.text', "Project deleted successfully");
    }

    deleteCreatedProject1() {
        cy.wait(2000)
        cy.get('.caption').click()
        cy.wait(3000)
        cy.get('.caption').click()
        cy.wait(3000)
        cy.get('[style="display: block;"] > .imx-table-container > .mat-table > tbody > :nth-child(1) > .action-menu-column > .mat-icon')
            .click();
        cy.wait(2000)
        cy.get('.mat-menu-content > :nth-child(2)').click();
        cy.wait(2000)
        cy.get('.continue-btn').click();

        cy.get('.mat-simple-snackbar > :nth-child(1)').should('contain.text', "Project deleted successfully");
    }

    updateScenarioName() {
        cy.get(':nth-child(1) > .status-cell > .imx-ml-10 > [fxlayout="row"] > .primary-color-text').click();
        cy.wait(20000)
        cy.get('.editIcon').click();
        cy.xpath("//mat-label[text()='Scenario Name']//parent::label//parent::span//parent::div//input").clear();
        cy.xpath("//mat-label[text()='Scenario Name']//parent::label//parent::span//parent::div//input").type('test');
       // cy.get('span').contains('Save').click();
       cy.xpath("//span[text()='Save']").eq(1).click()
        cy.get('.caption').click();
    }

    searchScenarioName() {
        cy.get('.header-search > .header-search__label > .mat-icon').click();
        cy.xpath("//mat-label[text()='Search Scenarios']//parent::label//parent::span//parent::div//input").clear();
        cy.xpath("//mat-label[text()='Search Scenarios']//parent::label//parent::span//parent::div//input").type('test');
    }

    clickOnAudienceFilter() {
        cy.get('[aria-label="Change sorting for audiences"] div mat-icon [viewBox="0 0 24 24"]').click();
        cy.get('.imx-button-basic_icon > .mat-button-wrapper').click();

    }

    clickOnMarketsFilter() {

        // cy.get('.cdk-column-market > .mat-sort-header-container > .mat-sort-header-button > .header-search__label > .mat-icon > svg').click();
        cy.xpath("//mat-icon[@svgicon='IMX-filter']").eq(0).click()
        cy.xpath("//span[text()='Inventory Plan']").click()
        cy.xpath("//span[text()='APPLY']").click()
        // cy.get('.imx-button-basic_icon > .mat-button-wrapper').click();
    }

    duplicateScenario() {
        cy.get(':nth-child(2) > .action-menu-column > .mat-icon').click();
        cy.wait(3000)
        cy.get('.mat-menu-content > :nth-child(1)').click();
     // cy.get('#mat-input-35').clear();
       // cy.get('#mat-input-35').type('Test');
       cy.xpath("//mat-label[text()='Scenario Name']//parent::label//parent::span//parent::div//input").clear().type('Test')
       // cy.get('.imx-button-primary > .mat-button-wrapper').click();
       cy.xpath("//span[text()='Create Scenario']").click()
        cy.wait(2000);
        cy.get('.caption').click();     
    }

    deleteScenario() {
        cy.get(':nth-child(2) > .action-menu-column > .mat-icon').click();
        cy.get('.mat-menu-content > :nth-child(2)').click();
        cy.get('.continue-btn > .mat-button-wrapper').click();
        cy.get('.mat-simple-snackbar > :nth-child(1)').should('contain.text', "Scenario deleted successfully");
    }

    generateInventoryPlanFromMarketPlan() {
        cy.get('.caption').click();
        cy.get('.action-menu-column > .mat-icon').click();
        cy.get('.mat-menu-content > :nth-child(4)').click();
    }

    moveToInventoryPlanAndSelectPlanPeriod() {
        cy.get('[class= "mat-tab-label-content"]').contains('INVENTORY PLAN').click();
        cy.get('[formcontrolname="plan_period_type"]').click();
        cy.get('mat-option').contains('Specific').click()
    }

    clickOnStartDatePicker() {
        cy.get('[mattooltip= "Select Start Date"]').click();
        cy.get('[aria-label="Tue Apr 27 2021"] > .mat-calendar-body-cell-content').click()
    }

    clickOnEndDatePicker() {
        cy.get('[mattooltip= "Select End Date"]').click();
        cy.get('[aria-label="Fri Apr 30 2021"] > .mat-calendar-body-cell-content').click()
    }

    updateProjectNameAndDesc(updateProjName) {
        cy.get('.editIcon').click();
        cy.wait(3000)
        cy.get('[formcontrolname="name"]').clear({force: true});
        cy.get('[formcontrolname="name"]').first().type(updateProjName);
        cy.get('[formcontrolname= "description"]').clear();
        cy.get('[formcontrolname= "description"]').type('test');
        cy.get('.imx-button-primary > .mat-button-wrapper').click();
    }

    clickOnAddScenario() {
        cy.get('.imx-button-primary_icon > .mat-button-wrapper').click();
    }

    clickOnYesButtonInPopup() {
        cy.get('.continue-btn > .mat-button-wrapper').click();
    }

    clickOnCreatedScenario() {
        cy.wait(3000)
        cy.get('.status-cell').click()
    }

    clickOnExpandIconInInventoryPlan() {
        cy.get('[tooltip="Expand Table"]').click()
    }

    clickOnCollapseTableInInventoryPlan() {
        //cy.get('[fxflex="80"] > .mat-icon > svg').click()
        cy.get("mat-icon[tooltip='Collapse Table']>svg").click()
    }

    clickOnArrowButtonInInventory() {
       // cy.get('#inventory-plan-dialog-fullscreen > .mat-sort > .element-row > .cdk-column-accordion > .mat-icon').click()
       cy.xpath("//mat-icon[text()=' keyboard_arrow_down ']").eq(1).click({ force: true })
    }

    clickOnMap() {
        cy.get('.map-inventory > .mat-button-wrapper > span').click();
        cy.wait(120000);
    }

    loginFacebook() {

        cy.get('[data-testid=royal_email]').clear()
        cy.get('[data-testid=royal_email]').type("manju")
        cy.wait(5000)
        cy.get('[data-testid=royal_pass]').clear()
        cy.get('[data-testid=royal_pass]').type("kruthikajava")
        cy.wait(5000)
        cy.get('[data-testid=royal_login_button]').click()
        cy.wait(5000)
    }

    moveMarketScenarioToSandbox() {
        cy.get(':nth-child(2) > .action-menu-column > .mat-icon').click()
        cy.get('.mat-menu-content > :nth-child(3)').click()
        cy.get('[formcontrolname="project"]').click()
        cy.get('[formcontrolname="project"]').type("Sandbox")
        cy.wait(2000)
        cy.get('.mat-option-text').click({ multiple: true })
        cy.wait(2000)
        //cy.get('.imx-button-primary > .mat-button-wrapper').click()
        cy.xpath("//span[text()='Move']").click({force: true})
        cy.wait(2000)
        //   cy.get('.noDataFound').should('contain.text', 'No records found')
        cy.get('.mat-snack-bar-container').should('contain.text', 'Scenario moved successfully')
    }

    moveScenarioToSandbox() {
        cy.get('.action-menu-column > .mat-icon').click({ multiple: true })
        cy.get('.mat-menu-content > :nth-child(3)').click()
        cy.get('[formcontrolname="project"]').click()
        cy.get('mat-option[xpath="1"]>span[class="mat-option-text"]').contains('Sandbox').click({ force: true })
        cy.get('.imx-button-primary > .mat-button-wrapper').click()
    }

    moveScenarioToRequiredProject(campName1) {
        cy.get('app-project-view-v3 > :nth-child(1) > .imx-project-list > .imx-table-container > .mat-table > tbody > :nth-child(1) > .action-menu-column > .mat-icon').click()
        cy.get('.mat-menu-content > :nth-child(3)').click()
        cy.get('[formcontrolname="project"]').click()
        cy.get('[formcontrolname="project"]').type(campName1)
        cy.wait(2000)
        cy.get('.mat-option-text').click({ multiple: true })
        cy.wait(2000)
        cy.xpath("//span[text()='Move']").click()
        cy.wait(2000)
        cy.get('.mat-snack-bar-container').should('contain.text', 'Scenario moved successfully')
    }

    selectDatasource2021() {
        cy.wait(20000)
        cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
        cy.wait(6000)
        cy.get('.data-source-title').click()
        cy.get(':nth-child(2) > .mat-list-item-content > .mat-list-text > .action-item > div').click()
        cy.get('.data-menu > .imx-button-primary').click()
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').clear();
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').click({ multiple: true });
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').type('Persons 5+ yrs');
        cy.wait(3000)
        cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click(5, 60, { force: true })
        //cy.get('.apply-btn cursor-link').click(5, 60, { force: true });
        cy.wait(2000)
        cy.get('.apply-btn > .mat-focus-indicator > .mat-button-wrapper').click();
    }
    selectDatasource2020() {
        cy.get(':nth-child(1) > .mat-focus-indicator > .mat-button-wrapper > .mat-icon').click({ multiple: true });
        cy.wait(6000)
        cy.get('.data-source-title').click()
        cy.get(':nth-child(3) > .mat-list-item-content > .mat-list-text > .action-item > div').click()
        cy.get('.data-menu > .imx-button-primary').click()
        cy.wait(2000)
        cy.get('[class="mat-ripple mat-tab-label mat-focus-indicator ng-star-inserted"]').contains('Population').click()
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').clear();
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').click({ multiple: true });
        cy.get('[data-placeholder="Search demographics, behaviors, etc"]').type(('Persons 5+ yrs'));
        cy.wait(3000)
        cy.get(':nth-child(1) > .mat-list-item-content > .mat-pseudo-checkbox').click(5, 60, { force: true })
        //cy.get('.apply-btn cursor-link').click(5, 60, { force: true });
        cy.wait(2000)
        cy.get('.apply-btn > .imx-button-basic_icon > .mat-button-wrapper').click();
    }
}

export default WorkspacePage;
