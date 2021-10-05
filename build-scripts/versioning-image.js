const package = require('../package.json');
const replace = require('replace-in-file');

try {

    let imageVersion = package['devops']['image-version'];
    let imageRC      = package['devops']['image-rc'];
    let imageHotfix  = package['devops']['image-hotfix'];
    let release      = package['devops']['release'];

    if (imageHotfix) {
        imageRC = imageRC + 1;
    } else {
        let buildNumber  = process.env.BUILD_NUMBER;

        let date = new Date();
        let month = date.getUTCMonth() + 1; //months from 1-12
        let year = date.getUTCFullYear();

        imageVersion = `${year}.${month}.${buildNumber}`;
        imageRC      = 1;
    }

    let stageVersion = `${imageVersion}_rc-${imageRC}`;

    // package.json image version
    updateImageVersion('package.json', /"image-version": "(.*)"/g, `"image-version": "${imageVersion}"`);

    // package.json image rc
    updateImageVersion('package.json', /"image-rc": \d+/g, `"image-rc": ${imageRC}`);

    // environment image version
    updateImageVersion('src/environments/environment.prod.ts', /image_version: "(.*)"/g, `image_version: "${imageVersion}"`);

    // environment image rc
    updateImageVersion('src/environments/environment.prod.ts', /image_rc: \d+/g, `image_rc: ${imageRC}`);

    if (release || imageHotfix) {

        // staging image version
        updateImageVersion('Jenkinsfile-Staging', /final tag = "v(.*)_rc-\d+"/g, `final tag = "v${stageVersion}"`)

        // staging pull image version
        updateImageVersion('Jenkinsfile-Staging', /final pullRepoTag = "v(.*)_integration"/g, `final pullRepoTag = "v${imageVersion}_integration"`)

        // prod image version
        updateImageVersion('Jenkinsfile-Production', /final tag = "v(.*)"/g, `final tag = "v${imageVersion}"`)

        // prod pull image version
        updateImageVersion('Jenkinsfile-Production', /final pullRepoTag = "v(.*)_rc-\d+"/g, `final pullRepoTag = "v${stageVersion}"`);

        // package.json release
        updateImageVersion('package.json', /"release": true/g, `"release": false`);

        // package.json image-hotfix
        updateImageVersion('package.json', /"image-hotfix": true/g, `"image-hotfix": false`);
    }
}
catch (error) {
    console.error('Error occurred:', error);
    throw error
}

function updateImageVersion(file, pattern, to) {

    let option = {
        files: `${file}`,
        from: pattern,
        to: `${to}`,
        allowEmptyPaths: false
    };

    let change = replace.sync(option);
    if (change === 0) throw "Please make sure that file '" + option.files + "' has \"version: ''\"";
}
