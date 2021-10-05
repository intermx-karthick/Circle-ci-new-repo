// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');
const HtmlReporter = require('protractor-beautiful-reporter');
var d = new Date();

var datestring = d.getDate() + '_' + (d.getMonth() + 1) + '_' + d.getFullYear() + '_' +
  d.getHours() + '_' + d.getMinutes();

exports.config = {
  suites: {
    home: ['./e2e/login/loginScreen.ts','./e2e/home/homeNavs.ts', './e2e/logout/logout.ts'],
    placesDefineTarget: ['./e2e/login/loginScreen.ts', './e2e/places/placesDefineTarget.ts', './e2e/logout/logout.ts'],
    myPlacesAndLayers: ['./e2e/login/loginScreen.ts', './e2e/places/myPlacesAndLayers.ts', './e2e/logout/logout.ts'],
    auditHours: ['./e2e/login/loginScreen.ts', './e2e/places/auditHours.ts', './e2e/logout/logout.ts'],
    exploreSelectAudience:  ['./e2e/login/loginScreen.ts','./e2e/explore/exploreSelectAudience.ts', './e2e/logout/logout.ts'],
    exploreAssignMarket: ['./e2e/login/loginScreen.ts','./e2e/explore/exploreAssignMarket.ts', './e2e/logout/logout.ts']
    },
// Whole run
//     suites: {
//       login: './e2e/login/loginScreen.ts',
//       home: './e2e/home/homeNavs.ts',
//       placesDefineTarget:  './e2e/places/placesDefineTarget.ts', 
//       myPlacesAndLayers: './e2e/places/myPlacesAndLayers.ts',
//       auditHours: './e2e/places/auditHours.ts', 
//       exploreDefineTarget: './e2e/explore/exploreDefineTarget.ts', 
//       logout: './e2e/logout/logout.ts'
//       },

  capabilities: {
    'browserName': 'chrome',
    chromeOptions: {
      args: ['--window-size=800,600']
    },

  },
  directConnect: true,
  baseUrl: 'https://gp.intermx.io',
  restartBrowserBetweenTests: false,
  framework: 'jasmine',
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 1000000,
    browserNoActivityTimeout: 300000,
    isVerbose: true,
    print: function () { }
  },

  onPrepare() {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
    browser.driver.manage().window().maximize();
    browser.driver.manage().timeouts().setScriptTimeout(1000000);
    jasmine.getEnv().addReporter(new HtmlReporter({
      baseDirectory: 'Target' + '/Reports' + datestring + '/Screenshots'
    }).getJasmine2Reporter());
    jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
  }
};