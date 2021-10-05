/**
 * Helper function for looping over Map object
 *
 */
@NonCPS
def mapToList(depmap) {
    def dlist = []
    for (def entry in depmap) {
        dlist.add(new java.util.AbstractMap.SimpleImmutableEntry(entry.key, entry.value))
    }
    dlist
}

/**
 * Functions to validate image
 *
 */
def helmLint(Map args) {
    // lint helm chart
    sh "/usr/local/bin/helm lint ${args.chart_dir} --set build=${args.commit_id},image.tag=${args.tag},image.app.repository=${args.appRepo},image.proxy.repository=${args.proxyRepo},image.app.tag=${args.tag},image.proxy.tag=${args.tag},version=${args.version},config.directory=config/${args.namespace},logging.env.cloud_id=${ELASTIC_ID},logging.env.username=${ELASTIC_USER},logging.env.password=${ELASTIC_PASSWORD},ingress.type=${INGRESS_VERSION},context=${args.context},ingress.entry=${args.entry}"
}

/**
 * Functions to deploy image
 *
 */
def helmDeploy(Map args) {
    try {

        // Configure helm client and confirm tiller process is installed

        if (args.dry_run) {
            println "Running dry-run deployment"

            sh "/usr/local/bin/helm install --dry-run --debug ${args.name} ${args.chart_dir} --set build=${args.commit_id},image.app.repository=${args.appRepo},image.tag=${args.tag},image.proxy.repository=${args.proxyRepo},image.app.tag=${args.tag},image.proxy.tag=${args.tag},version=${args.version},config.directory=config/${args.namespace},logging.env.cloud_id=${ELASTIC_ID},logging.env.username=${ELASTIC_USER},logging.env.password=${ELASTIC_PASSWORD},ingress.type=${INGRESS_VERSION},context=${args.context},ingress.entry=${args.entry},ingress.external=${args.external} --namespace=${args.namespace}"
        } else {
            println "Running deployment"

            sh "/usr/local/bin/helm upgrade --install ${args.name} ${args.chart_dir} --set build=${args.commit_id},image.tag=${args.tag},image.app.repository=${args.appRepo},image.proxy.repository=${args.proxyRepo},image.app.tag=${args.tag},image.proxy.tag=${args.tag},version=${args.version},config.directory=config/${args.namespace},logging.env.cloud_id=${ELASTIC_ID},logging.env.username=${ELASTIC_USER},logging.env.password=${ELASTIC_PASSWORD},ingress.type=${INGRESS_VERSION},context=${args.context},ingress.entry=${args.entry},ingress.external=${args.external} --namespace=${args.namespace}"

            echo "Application ${args.name} successfully deployed. Use helm status ${args.name} to check."
        }

        notifyBuild('SUCCESS', null, null, "Image deployed to `${args.namespace}` Kubernetes successfully.")
    }

    catch(exception) {

        // Slack notification failure.
        notifyBuild('FAILURE', null, null, "Error in pushing image to `${args.namespace}` Kubernetes - Retrying.", args.notify, args.slack_channel)

        println "Error on Upgrade / Install"
    }
}

/**
 * Track Git logs
 *
 */
def showChangeLogs(versionHash) {

    def authors       = []
    def accept        = []
    def changeLogSets = currentBuild.rawBuild.changeSets

    if (changeLogSets.size() == 0) return [];

    for (int i = 0; i < changeLogSets.size(); i++) {

        def entries = changeLogSets[i].items
        for (int j = 0; j < entries.length; j++) {

            def author = "${entries[j].author}"
            def email  = "${entries[j].authorEmail}"

            authors.push("${author}:${email}")

            def isParent   = false
            def source     = currentBuild.rawBuild.changeSets[i].browser.getChangeSetLink(entries[j]).toString().split('/')[4]
            def sourceDirs = []

            switch (source) {
                case 'widgetworld':
                    entries[j].comment.contains(versionHash) ?: accept.push(source)
                    isParent = true
                    break
                case 'intermx-cicd-helm':
                    sourceDirs = ['insights-ui']
                    break
            }

            if (isParent) continue;

            def entry = entries[j]
            def files = new ArrayList(entry.affectedFiles)

            for (int k = 0; k < files.size(); k++) {

                !sourceDirs.contains(files[k].path.split('/')[0]) ?: accept.push(files[k].path)
            }
        }
    }

    return accept.unique().size() == 0 ?: authors.unique()
}

/**
 * TODO: Track Container Deployment Status
 *
 */
def getDeploymentStatus(commitId, environment) {
    sh "sleep 10s"

    def status
    def sleep   = ['ContainerCreating', 'Pending', 'Succeeded']
    def success = ['Running']
    def failure = ['CrashLoopBackOff', 'Terminating', 'Error']

    sh "kubectl get pods -l build=${commitId} --namespace=${environment} --sort-by=.status.startTime"

    def deploymentVerify = sh (script: "kubectl get pods -l build=${commitId} --namespace=${environment} --sort-by=.status.startTime | awk 'NR==2{print \$3}'", returnStdout: true).trim()
    def containerCount   = sh (script: "kubectl get pods -l build=${commitId} --namespace=${environment} --sort-by=.status.startTime | awk 'NR==2{print \$4}'", returnStdout: true).trim().toInteger()

    echo "Deployment Status: ${deploymentVerify}"
    echo "Container Restart Count: ${containerCount}"

    if (sleep.contains(deploymentVerify)) {
        return getDeploymentStatus(commitId, environment)
    }

    if (success.contains(deploymentVerify)) {
        if (containerCount == 0) {
            return true
        } else {
            return false
        }
    }

    if (failure.contains(deploymentVerify)) {
        return false
    }
}

/**
 * Jenkins pipeline stages.
 *
 * A list of stages available in this pipeline Jenkins file will be executed
 * squentially. The name of this file should be matching with Pipeline block of
 * Jenkins configuration.
 *
 */
node {

    /**
     * Version details for tagging the image.
     *
     */
    def tag
    def tagDev

    /**
     * Define script variables.
     *
     */
    def notify
    def slackChannel = "#general"
    def organization = "${ORGANIZATION}"
    organization = organization.toUpperCase()
    // Docker image
    def app
    def proxy
    // Config.json file
    def config
    // Component specific variables builds
    def component = "insights-ui"
    def cluster = "delivery"
    def environment = "development"
    def chartDirectory
    // Config File from S3
    def configFile
    // Git Credentials
    def gitCredentials = "impinger-cicd-github"
    // Helm Repository
    def helmRepo = "git@github.com:InterMx/intermx-cicd-helm.git"
    // Helm Branch
    def helmBranch = "delivery"
    // S3 Config Bucket
    def configBucket = "${AWS_BUCKET_NAME}"
    // AWS Credentials
    def awsCredentials = "intermx-impinger-credentials"
    // ECR Repository for application
    def appEcrRepoName = "intermx-insights-ui"
    // ECR Repository for proxy
    def proxyEcrRepoName = "intermx-insights-proxy"
    // ECR Repository Endpoint
    def ecrEndpoint = 'https://${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com'
    // ECR FQDN
    def ecrAppRepo = "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/${appEcrRepoName}"
    def ecrProxyRepo = "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/${proxyEcrRepoName}"
    // ECR Credentials
    def ecrCredentials = "ecr:us-east-1:${awsCredentials}"
    // Context name to avoid collisions
    def context = "ui"
    // Helm deployment name to avoid collisions
    def deploymentName = "intermx-insights-ui"
    // Default entry point for Traefik
    def entryPoint = "https"
    // Default externality forr Traefik
    def external = "false"
    // Version Hash
    def versionHash = '2d3cbcc5acfa4626c44f81f33c5f7013'
    // Git commit message
    def commitMessage
    def currRepoBranch
    def commitId
    def deployment

    try {

        /**
         * Cloning the repository to workspace to build image.
         *
         */
        checkout scm

        // Get helm charts from git repo
        dir('helm') {
            git url: helmRepo, branch: helmBranch, credentialsId: gitCredentials, changelog: false, poll: false
        }

        def (origin, branch) = scm.branches[0].name.tokenize('/')

        commitMessage  = sh (script: 'git log --oneline -1 ${GIT_COMMIT}', returnStdout: true).trim().substring(8)
        commitId       = sh (script: 'git log -1 --format=%H', returnStdout: true).trim() // %h, for short hash
        notify         = showChangeLogs(versionHash)
        currRepoBranch = branch;

        if (notify instanceof Boolean && Boolean.TRUE.equals(notify)) {

            return
        }

        // Slack notification in progress.
        notifyBuild('STARTED', currRepoBranch, commitMessage)

        sh "echo ${currRepoBranch} branch"

        /**
         * Get dependencies for Kubernetes Deploy (Development).
         *
         */
        stage('Get Dependencies for Development') {

            // Download config.json from S3 into the insights-service/config helm repo
            final s3ConfigPath = "${cluster}/${environment}/${component}"

            chartDirectory = "helm/${component}"
            configFile     = "${chartDirectory}/config/${environment}/config.json"

            dir("${chartDirectory}/config/${environment}") {
                withAWS(credentials:awsCredentials) {
                    s3Download(file: 'config.json', bucket: configBucket, path: "${s3ConfigPath}/config.json", force: true)
                    s3Download(file: 'filebeat.yaml', bucket: configBucket, path: "${s3ConfigPath}/filebeat.yaml", force: true)
                    s3Download(file: 'ilm_policy.json', bucket: configBucket, path: "${s3ConfigPath}/ilm_policy.json", force: true)
                }
            }
        }

        /**
         * Environment variables for Kubernetes (Development).
         *
         */
        stage('Build Kubernetes Env Variables From Config for Development') {

            config = readJSON file: "${configFile}"

            for (entry in mapToList(config)) {
                dir("${chartDirectory}/config/${environment}"){
                    writeFile file: "${entry.key}", text: "${entry.value}"
                }
            }
        }

        /**
         * Add Required Tools to Run NodeJS.
         *
         */
        stage('Add NodeJS Tool') {
            env.NODEJS_HOME = "${tool 'node'}"
            env.PATH        = "${env.NODEJS_HOME}/bin:${env.PATH}"

            //sh "npm install"
        }

        /**
         * Version Automation.
         *
         */
        stage('Update Version') {

            // Update Docker image version and commit to Git
            dir('git-local-branch') {

                git url: 'git@github.com:InterMx/widgetworld.git', branch: "${currRepoBranch}", credentialsId: gitCredentials

                // Update Image Version
                sh "npm i --no-package-lock --no-save replace-in-file && node build-scripts/versioning-image.js"
                sh "cp src/environments/environment.prod.ts ../src/environments/environment.prod.ts"


                // Update package.json version
                def json            = readJSON file: "package.json"
                def current_version = json.version
                def image_version   = json.devops['image-version']
                def npmv

                echo "current version: ${current_version}"

                def version = current_version.toString().tokenize('.')

                if (version[2].toInteger() < 99) {
                    npmv = 'patch'
                } else if (version[1].toInteger() < 99) {
                    npmv = 'minor'
                } else {
                    npmv = 'major'
                }

                tagDev = "v${image_version}_development"

                // sh "npm version ${npmv} --no-git-tag-version"

                sh "git status"

                if ("${organization}" == "INTERMX") {
                    sshagent (credentials: [gitCredentials]) {
                        sh "git config --local user.name imx-svc"
                        sh "git config --local user.email insights-service@intermx.com"
                        sh "git diff package.json src/environments/environment.prod.ts"
                        sh "git diff --quiet && git diff --staged --quiet || git commit -m 'Version Update - ${versionHash}' package.json package-lock.json src/environments/environment.prod.ts Jenkinsfile Jenkinsfile-Integration Jenkinsfile-Staging Jenkinsfile-Production"
                        sh "git pull origin ${currRepoBranch} --rebase"
                        sh "git push -u origin ${currRepoBranch} --no-verify"
                    }
                }
            }

            // Delete Dir after update image version
            sh "rm -rf git-local-branch"
        }

        /**
         * Building the Docker image from cloned repository for Development.
         *
         */
        stage('Build Image for Development') {

            // https://www.jenkins.io/doc/pipeline/steps/credentials-binding/
            withCredentials([usernamePassword(credentialsId: 'UI-AWS-Credential-Intermx', usernameVariable: "${UI_AWS_ACCESS_KEY}", passwordVariable: "${UI_AWS_SECRET}")]) {
                app   = docker.build(appEcrRepoName, "--build-arg AWS_ACCESS_KEY_ID=${UI_AWS_ACCESS_KEY} --build-arg AWS_SECRET_ACCESS_KEY=${UI_AWS_SECRET} -f node.Dockerfile --network host .")
                proxy = docker.build(proxyEcrRepoName, "--build-arg AWS_ACCESS_KEY_ID=${UI_AWS_ACCESS_KEY} --build-arg AWS_SECRET_ACCESS_KEY=${UI_AWS_SECRET} -f nginx.Dockerfile --network host .")
            }
        }

        /**
         * Authenticate and push the built image to AWS ECR for Development.
         *
         */
        stage('Push Image for Development') {

            docker.withRegistry(ecrEndpoint, ecrCredentials) {

                /**
                 * Push the built Image to AWS ECR for Development.
                 *
                 */
                app.push(tagDev)
                proxy.push(tagDev)
            }
        }

        /**
         * Deploy Image to Kubernetes using Helm for Development.
         *
         */
        stage('Deploy Image for Development') {
            entryPoint = "https"
            external = "false"
            // Run helm chart linter
            helmLint(
                chart_dir     : chartDirectory,
                chart_version : environment,
                appRepo       : ecrAppRepo,
                proxyRepo     : ecrProxyRepo,
                tag           : tagDev,
                name          : deploymentName,
                version       : environment,
                namespace     : environment,
                context       : context,
                entry         : entryPoint,
                external      : external,
                commit_id     : commitId
            )

            // Deploy using Helm chart
            helmDeploy(
                dry_run       : false,
                name          : deploymentName,
                appRepo       : ecrAppRepo,
                proxyRepo     : ecrProxyRepo,
                chart_dir     : chartDirectory,
                tag           : tagDev,
                version       : environment,
                namespace     : environment,
                notify        : notify,
                slack_channel : slackChannel,
                context       : context,
                entry         : entryPoint,
                external      : external,
                commit_id     : commitId
            )
        }

        /**
         * Track Container Status for Development
         *
         */
        stage('Track Container Status for Development') {
            // deployment = getDeploymentStatus(commitId, environment);

            // Slack notification success.
            /* if (deployment) {
                notifyBuild('SUCCESS', null, null, "Image deployed to `${environment}` Kubernetes successfully.")
            } else {
                notifyBuild('FAILURE', null, null, "Error in creating container, please check the code for ${environment}", notify, slackChannel)

                error ("Error in creating container, please check the code for ${environment}")
            } */

            // notifyBuild('SUCCESS', null, null, "Image deployed to `${environment}` Kubernetes successfully.")
        }
    }

    catch(exception) {

        echo "${exception}"

        // Slack notification failure.
        notifyBuild('FAILURE', null, null, 'Something went wrong in one of the stages, exception found in Jenkins.', notify, slackChannel)
    }

    finally {

        // Clean up the workspace after finish the job.
        deleteDir()
    }
}

/**
 * Sending notifications to Slack channel.
 *
 */
def notifyBuild(buildStatus = 'FAILURE', branch = null, commitMessage = null, message = null, notify = null, channel = null) {

    // Default values
    def summary
    def alert   = false
    def baseURL = "${SLACK_BASE_URL}"

    if (buildStatus == 'STARTED') {
        color = 'YELLOW'
        colorCode = '#FFFF00'
        summary = "${buildStatus}: ${organization} - Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' is currently working on branch '${branch}' with a message: '${commitMessage}'"
    } else if (buildStatus == 'SUCCESS') {
        color = 'GREEN'
        colorCode = '#00FF00'
        summary = "${buildStatus}: ${organization} - Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' | Message: ${message}"
    } else {
        color = 'RED'
        colorCode = '#FF0000'
        summary = "${buildStatus}: ${organization} - Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' | Error: ${message} | URL: `${env.BUILD_URL}console` (please make sure, you are on VPN to access the Jenkins link)"
        alert = true
    }

    // Send notifications to Slack.
    slackSend (baseUrl: baseURL, color: colorCode, message: summary)

    if (alert) {

        for(int i = 0; i < notify.size(); i++) {
            def notice = notify[i].split(":")
            def author = notice[0]
            def email  = notice[1]
            def domain = email.split("@")[1]

            if (domain && domain == 'intermx.com') {

                emailext (
                    to: "${email}",
                    subject: "${buildStatus}: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                    body: """
                      <html>
                        <body>
                          <p>Hi ${author},</p>
                          <br>
                          <p>The build job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' failed to complete.</p>
                          <p>The following error was reported:</p>
                          <br>
                          <p>${message}</p>
                          <br>
                          <p>Please review the error at <a href=\"${env.BUILD_URL}console\">${env.BUILD_URL}console</a> and resolve the issue causing the failure so that releases can continue.</p>
                        </body>
                      </html>
                    """
                )
            }
        }

        slackSend (baseUrl: baseURL, channel: "${channel}", color: colorCode, message: summary)
    }
}