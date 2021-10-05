exports.config = {
  capabilities: {
    'browserName': 'chrome',
    'version': 68,
    'os': 'windows',
    'os_version': '8.1',
    'browserstack.debug': 'true',
    'browserstack.networkLogs': 'true',
    'browserstack.local' : 'true',
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_KEY
  },
  seleniumAddress: 'http://hub-cloud.browserstack.com/wd/hub',
  suites: {
    test: './e2e/test.spec.ts'
  }
};
