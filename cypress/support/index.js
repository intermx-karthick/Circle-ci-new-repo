// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'


// Alternatively you can use CommonJS syntax:
// require('./commands')
/*beforeEach(() => {
  cy.log('I run before every test in every spec file!!!!!!')
})*/

// Enable support for xpath
import "cypress-xpath"
//require('cypress-xpath')

/*const fs = require('fs');
// fs.writeFileSync("F://Cypress//intermx//cypress//fixtures//exportInventory.json", JSON.stringify(json), "utf-8", (err) => {
//   if (err) console.log(err)
// })
const path = require("path");
const csvtojson = require('csvtojson')
const csvfilepath = "F://Cypress//intermx//cypress//downloads//scenario-inventory-plan.csv"

csvtojson()
.fromFile(csvfilepath)
.then((json) => {
    console.log(json)

    fs.writeFileSync("F://Cypress//intermx//cypress//fixtures//exportInventory.json", JSON.stringify(json), "utf-8", (err) =>{
        if(err) console.log(err)
    })
})*/
  // afterEach(() => {
  //   cy.wait(8000)
  //   cy.get('.caption').click();
  //   cy.wait(2000)
  //   cy.get('[style="display: block;"] > .imx-table-container > .mat-table > tbody > :nth-child(1) > .action-menu-column > .mat-icon')
  //   .click();
  //   cy.wait(2000)
  //   cy.get('.mat-menu-content > :nth-child(2)').click();
  //   cy.wait(2000)
  //   cy.get('.continue-btn').click();
  //   cy.wait(2000)
  //   cy.get( '.mat-simple-snackbar > :nth-child(1)').should('contain.text', "Project deleted successfully");
  // })
  // const xlsx = require("node-csv").default;
  // const fs = require("fs");
  // const path = require("path");

  // module.exports = (on, config) => {
  //   // `on` is used to hook into various events Cypress emits
  //   on("task", {
  //     parseXlsx({ filePath }) {
  //       return new Promise((resolve, reject) => {
  //         try {
  //           const jsonData = csv.parse(fs.readFileSync(filePath));
  //           resolve(jsonData);
  //         } catch (e) {
  //           reject(e);
  //         }
  //       });
  //     }
  //   });

  //   on("before:browser:launch", (browser = {}, launchOptions) => {
  //     const downloadDirectory = path.join(__dirname, '..', 'excelDownloads')

  //     if (browser.family === 'chromium') {
  //      launchOptions.preferences.default['download'] = { default_directory: downloadDirectory }
  //     }
  //     return launchOptions;
  //   });



  // const CSVToJSON = require("csvtojson")
  // const fs = require("fs")
  // CSVToJSON.fromFile("cypress//downloads//scenario-market-plan.csv").then(source =>{

  // console.log(source)

  // })

 /* const fs = require("fs")
  const path = require("path");
  const csvtojson = require('csvtojson')
  const csvfilepath = "F://Cypress//intermx//cypress//downloads//scenario-inventory-plan.csv"
  csvtojson()
  .fromFile(csvfilepath)
  .then((json) => {
      console.log(json)
  
      fs.writeFileSync("F://Cypress//intermx//cypress//fixtures//exportInventory.json", JSON.stringify(json), "utf-8", (err) =>{
          if(err) console.log(err)
      })
  })
  */

  /*beforeEach(function() {
    let testSuite = Cypress.env('SUITE');
    if (!testSuite) { 
      return;
    }
    
    const testName = Cypress.mocha.getRunner().test.fullTitle();
    testSuite = "<"+testSuite+">"
    if (!testName.includes(testSuite)) {
      this.skip();
    }
  })*/

  Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
  })

