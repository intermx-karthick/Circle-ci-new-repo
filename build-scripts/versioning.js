var package = require('../package.json');
console.log(package.version);
var replace = require('replace-in-file');
var options = {
  files: 'src/environments/environment.prod.ts',
  from: /version: '(.*)'/g,
  to: "version: '"+ package.version + "'",
  allowEmptyPaths: false
};

try {
  var changedFiles = replace.sync(options);
  if (changedFiles === 0) {
    throw "Please make sure that file '" + options.files + "' has \"version: ''\"";
  }
  console.log('Build version set: ' + package.version);
}
catch (error) {
  console.error('Error occurred:', error);
  throw error
}
