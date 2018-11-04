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
                    //load pipeline configuration
                    config = load 'config/config.jenkins'
                    packageJSON = readJSON file: 'package.json'
                    //!create a long release name for archiving with job name, version, build number
                    //and commit id, e. g. PetClinic_1.3.1_12_e46554z
                    //sometimes Jenkins doesn't know the commitid (null)
                    if(env.GIT_COMMIT != null) {
                        shortRev = env.GIT_COMMIT.take(7)
                    } else {
                        echo "WARN: couldn't get git revision from environment variable, using manual determination via git rev-parse HEAD"
                        shortRev = sh script: 'git rev-parse HEAD', returnStdout: true
                        shortRev = shortRev.take(7)
                    }
                    releaseName = "${packageJSON.name}_${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}"
                    //!set Build name with unique identifier with version and build number id, e. g. "1.3.1_12"
                    currentBuild.displayName = "${packageJSON.version}_${env.BUILD_NUMBER}"
                    //notify slack about start
                    slackSend color: 'good', message: ":flugzeug_start: | ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} (<${env.BUILD_URL}|Open>)"
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
                    //create docker image and push it to dockerhub
                    docker.withRegistry('https://registry.hub.docker.com/', 'dockerhub') {
                        def dockerImage = docker.build("schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_ID}_${shortRev}", "--build-arg RELEASE=${releaseName} .")
                        dockerImage.push("${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}_rc")
                    }
                }
            }
        }
        stage('UAT') {
            stages {
                stage('DEPLOY') {
                    steps {
                        //deploy environment for acceptance test via docker image from dockerhub on jenkins host
                        sh "docker run -p 443 --name ${packageJSON.name}_uat_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} -e NODE_ENV='uat' -d schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}_rc"
                        script {
                            portOutput = sh(returnStdout: true, script: "docker port ${packageJSON.name}_uat_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME}").trim()
                            index = portOutput.indexOf(":") + 1
                            port = portOutput.drop(index)
                        }
                        //flightcheck the deployment
                        retry(10) {
                            httpRequest responseHandle: 'NONE', url: "http://95.216.189.36:${port}", validResponseCodes: '200', validResponseContent: "Welcome to ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}!"
                        }
                    }
                }
                stage('CYPRESS') {
                    agent {
                        //this image provides everything needed to run Cypress
                        docker 'cypress/browsers:chrome69'
                    }
                    environment {
                        //we will be recording test results and video on Cypress dashboard
                        //to record we need to set an environment variable for the credentials
                        CYPRESS_RECORD_KEY = credentials('cypress')
                        CYPRESS_baseUrl = "http://95.216.189.36:${port}"
                    }
                    steps {
                        //install node dependencies and cypress binary
                        sh 'npm install'
                        //check setup
                        sh 'npm run cy:verify'
                        // start test
                        sh "npm run uat"
                    }
                }
            }
            post {
                always {
                    //kill the container
                    sh "docker kill ${packageJSON.name}_uat_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} || true"
                }
            }
        }
    	stage('PROD') {
    		when {
    			//only commits to master should be deployed to production
    			branch 'master'
    		}
    		steps {
                //TODO: find a graceful way without downtime
                //kill old prod
                sh "docker rm ${packageJSON.name}_prod -f || true"
                //deploy new prod environment via docker image from dockerhub on jenkins host
                //TODO: use prod db locally (not mlab)
                sh "docker run -p 443:443 --name ${packageJSON.name}_prod -d schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}_rc"
                //flightcheck the deployment
                retry(10) {
                    httpRequest responseHandle: 'NONE', url: 'http://moveez.de', validResponseCodes: '200', validResponseContent: "Welcome to ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}!"
                }
                //TODO: tag docker image as latest
            }
    	}
    }
    post {
        success {
            slackSend color: 'good', message: ":herz: | ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} (<${env.BUILD_URL}|Open>)"
        }
        failure {
            slackSend color: 'warning', message: ":bumm: | ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} (<${env.BUILD_URL}|Open>)"
        }
    }
}