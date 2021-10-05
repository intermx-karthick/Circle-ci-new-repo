

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
// import 'cypress-plugin-snapshots/commands';
// const { initPlugin}= require("cypress-plugins-snapshot/plugin");
// const csv = require("csv")
// const { init } = require("ramda")
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {

  // on('task', {
  //   getConfigurationByFile() {
  //     //const file = fileName || config.env.configFile || 'qa'; // filename defaults

    
  //     return getConfigurationByFile;
 
  //   }
  // })

  // initPlugin(on, config);
  // on("task", {
  //   generateJsonFileFromCsv: generateJsonFileFromCsv
  // });
  //return config

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
}
// function generateJsonFileFromCsv(args){

//   const csv = require('csv-parser')
//   const fs = require('fs')
//   const results = []

//   fs.createReadStream('simple.csv')
//     .pipe(csv({}))
//     .on('data', (data) => results.push(data))
//     .on('end', () => {
//       console.log(results)
//     })

//   return results;
  
//  }

// const csv = require('csv-parser')
// const fs = require('fs')
// const results = []
/*
fs.createReadStream('simple.csv')
  .pipe(csv({}))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results)
  })
*/
// function getConfigurationByFile() {
// const csv = require('csv-parser')
// const fs = require('fs')
// const results = []
/*
fs.createReadStream('simple.csv')
  .pipe(csv({}))
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results)
    return results;
  })
*/
    

 