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
            steps {
                //deploy environment for acceptance test via docker image from dockerhub on jenkins host
                //TODO: use loackable resources or somehow dynamic port to enable multiple parallel tests
                sh "docker run -p 444:443 --name ${packageJSON.name}_uat_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME} -e NODE_ENV='uat' -d schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}_rc"
                //flightcheck the deployment
                retry(5) {
                    httpRequest responseHandle: 'NONE', url: 'http://95.216.189.36:444', validResponseCodes: '200', validResponseContent: "Welcome to ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}!"
                }
                //run acceptance test with cypress.io
                //sh "cypress run --record --key "
                //kill the container
                //TODO: if pipeline fails, it might not get killed
                sh "docker kill ${packageJSON.name}_uat_${packageJSON.version}_${env.BUILD_ID}_${shortRev}_${env.BRANCH_NAME}"
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
                sh "docker rm ${packageJSON.name}_prod -f"
                //deploy new prod environment via docker image from dockerhub on jenkins host
                //TODO: use prod db locally (not mlab)
                sh "docker run -p 443:443 --name ${packageJSON.name}_prod -d schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_NUMBER}_${shortRev}_rc"
                //flightcheck the deployment
                retry(5) {
                    httpRequest responseHandle: 'NONE', url: 'http://moveez.de', validResponseCodes: '200', validResponseContent: "Welcome to ${packageJSON.name}_${packageJSON.version}_${env.BUILD_ID}_${shortRev}!"
                }
                //TODO: tag docker image as latest
            }
    	}
    }
}