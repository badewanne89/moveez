#!groovy
pipeline {
    options {
        //enable timestamps in console output
        timestamps()
    }
    triggers {
        //polling SCM with cron syntax for new changes to trigger a build, default: every minute
        pollSCM('* * * * *')
    }
    // This configures the agent, where the pipeline will be executed. The default should be `none` so
    // that `Approval` stage does not block an executor on the master node.
    agent {
        node {
            label 'master'
            customWorkspace "${env.JOB_NAME}_${env.BUILD_NUMBER}"
        }
    }
    //configure npm
    tools {
        nodejs "node"
    }
    stages {
        stage('INIT') {
            steps {
                script {
                    //set names as variables
                    echo "##### createNames #####"
                    //derive app name from job name in jenkins
                    //multibranch pipelines contain the branch name in env.JOB_NAME, we don't want that in our appName
                    int jobNameDivider = env.JOB_NAME.indexOf("/")
                    if (jobNameDivider > -1) {
                        env.APP_NAME = env.JOB_NAME.take(jobNameDivider)
                    }
                    else {
                        env.APP_NAME = env.JOB_NAME
                    }
                    //sometimes Jenkins doesn't know the commitid (null)
                    if(env.GIT_COMMIT != null) {
                        env.REVISION = env.GIT_COMMIT.take(7)
                    } else {
                        echo "WARN: couldn't get git revision from environment variable, using manual determination via git rev-parse HEAD"
                        env.REVISION = sh script: 'git rev-parse HEAD', returnStdout: true
                        env.REVISION = env.REVISION.take(7)
                    }
                    //get version number from package.json
                    packageJSON = readJSON file: 'package.json'
                    //build releasename
                    env.RELEASE_NAME = "${env.APP_NAME}_${packageJSON.version}_${env.BUILD_NUMBER}_${env.REVISION}"
                    //build tag
                    env.DOCKER_IMAGE_NAME = "schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_NUMBER}_${env.REVISION}"
                    //set build display name
                    currentBuild.displayName = "${packageJSON.version}_${env.BUILD_NUMBER}"
                    //output names
                    echo """
                        |INFO: createNames derived the following names for your build:
                        | APP_NAME: ${env.APP_NAME}
                        | DOCKER_IMAGE_NAME: ${env.DOCKER_IMAGE_NAME}
                        | RELEASE_NAME: ${env.RELEASE_NAME}
                        | short REVISION: ${env.REVISION}
                    """.stripMargin()
                    //notify slack about start
                    committer = sh(returnStdout: true, script: "git show -s --pretty=%an").trim()
                    slackSend color: 'good', message: ":rocket::rocket::rocket: \n <${env.BUILD_URL}|${env.RELEASE_NAME}> \n branch: `${env.BRANCH_NAME}` \n commit by: *${committer}*"
                    //install npm dependencies
                    sh "npm install"
                }
            }
        }
        stage('TEST') {
            steps {
                script{
                    //!- unit/integration test
                    sh "npm test"
		            //sonarqube scan
		            def scannerHome = tool 'sonarqube'
		            withSonarQubeEnv('sonarcloud') {
		    	        sh "${scannerHome}/bin/sonar-scanner -Dproject.settings=test/sonar-project.properties"
		            }
                }
            }
        }
        stage('BUILD') {
            steps {
                script {
                    //run babel and webpack to produce dist dir
                    sh "npm run babel"
                    sh "npm run webpack"
                    //create docker image and push it to dockerhub
                    docker.withRegistry('https://registry.hub.docker.com/', 'dockerhub') {
                        def dockerImage = docker.build("${env.DOCKER_IMAGE_NAME}", "--build-arg RELEASE=${env.RELEASE_NAME} .")
                        dockerImage.push("${packageJSON.version}_${env.BUILD_NUMBER}_${env.REVISION}_rc")
                    }
                }
            }
        }
        stage('UAT') {
            stages {
                stage('DEPLOY') {
                    steps {
                        //deploy environment for acceptance test via docker image from dockerhub on jenkins host
                        sh "docker run -p 443 --name ${packageJSON.name}_uat_${env.RELEASE_NAME} -e NODE_ENV='uat' -d ${env.DOCKER_IMAGE_NAME}_rc"
                        script {
                            portOutput = sh(returnStdout: true, script: "docker port ${packageJSON.name}_uat_${env.RELEASE_NAME}").trim()
                            index = portOutput.indexOf(":") + 1
                            port = portOutput.drop(index)
                        }
                        //flightcheck the deployment
                        retry(10) {
                            httpRequest acceptType: 'APPLICATION_JSON', responseHandle: 'NONE', url: "http://95.216.189.36:${port}", validResponseCodes: '200', validResponseContent: "Welcome to ${env.RELEASE_NAME}!"
                        }
                    }
                }
                stage('CYPRESS') {
                    agent {
                        //this image provides everything needed to run Cypress
                        docker 'cypress/base:latest'
                    }
                    environment {
                        //we will be recording test results and video on Cypress dashboard
                        //to record we need to set an environment variable for the credentials
                        CYPRESS_RECORD_KEY = credentials('cypress')
                        CYPRESS_baseUrl = "http://95.216.189.36:${port}"
                        CYPRESS_API_KEY= credentials('uat_db_api_key')
                    }
                    steps {
                        //install node dependencies and cypress binary
                        sh 'npm install'
                        //check setup
                        sh 'npm run cy:verify'
                        // start test
                        sh "npm run uat"
                    }
                    post {
                        failure {
                            archiveArtifacts '/cypress/videos/title_page_spec.js.mp4'
                        }
                    }
                }
            }
            post {
                always {
                    //kill the container
                    sh "docker kill ${packageJSON.name}_uat_${env.RELEASE_NAME} || true"
                }
            }
        }
    	stage('PROD') {
    		when {
    			//only commits to master should be deployed to production
    			branch 'master'
    		}
    		steps {
                //TODO: change to blue/green
                //kill old prod
                sh "docker rm ${packageJSON.name}_prod -f || true"
                //deploy new prod environment via docker image from dockerhub on jenkins host, using credentials from Jenkins secret store
                withCredentials([usernamePassword(credentialsId: 'moveez_db_prod', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS')]){
                    sh "docker run -p 443:443 --restart unless-stopped --network=moveez_net --link mongodb -e DB_USER=${DB_USER} -e DB_PASS=${DB_PASS} --name ${packageJSON.name}_prod -e NODE_ENV='prod' -d ${env.DOCKER_IMAGE_NAME}_rc"
                }
                //TODO: add more tests
                //flightcheck the deployment
                retry(10) {
                    httpRequest acceptType: 'APPLICATION_JSON', responseHandle: 'NONE', url: 'http://moveez.de:443', validResponseCodes: '200', validResponseContent: "Welcome to ${env.RELEASE_NAME}!"
                }
                //TODO: tag docker image as latest
            }
    	}
    }
    post {
        success {
            slackSend color: 'good', message: ":heart::heart::heart: \n <${env.BUILD_URL}|${env.RELEASE_NAME}> \n branch: `${env.BRANCH_NAME}`"
        }
        failure {
            slackSend color: 'danger', message: ":boom::boom::boom: \n <${env.BUILD_URL}|${env.RELEASE_NAME}> \n branch: `${env.BRANCH_NAME}`"
        }
        always {
            deleteDir()
        }
    }
}