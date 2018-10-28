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
    tools {nodejs "node"}
    stages {
        stage('INIT') {
            steps {
                script {
                    //checkout repository
                    checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[credentialsId: 'github', url: 'https://github.com/schdief/moveez.git']]])
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
                        def dockerImage = docker.build("schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_ID}", "--build-arg RELEASE=${releaseName} .")
                        dockerImage.push("latest")
                        dockerImage.push("${packageJSON.version}_${env.BUILD_NUMBER}_alpha")
                    }
                }
            }
        }
        /*stage('UAT') {
            steps {
        		parallel(
        			'PERFORMANCE': {
                        //deploy environment for performance test via docker image from dockerhub on azure webapp service
                        azureWebAppPublish azureCredentialsId: 'azure', publishType: 'docker', resourceGroup: "moveezRG", appName: "${packageJSON.name}", slotName: "performance", dockerImageName: "schdieflaw/${packageJSON.name}", dockerImageTag: "${packageJSON.version}_${env.BUILD_ID}", dockerRegistryEndpoint: [credentialsId: 'dockerhub', url: "https://registry.hub.docker.com"]
                        //check the deployment
                        retry(5) {
                            httpRequest responseHandle: 'NONE', url: 'http://moveez-performance.azurewebsites.net', validResponseCodes: '200', validResponseContent: 'Welcome'
                        }
                        //run performance test using octoperf
                        octoPerfTest credentialsId: 'octoperf', scenarioId: 'AWDRqMX0yJH_vau-VobL', stopConditions: [stopOnAlert(buildResult: 'UNSTABLE', severity: 'CRITICAL')]
                    },
        			'EXPLORATIVE': {
        				//deploy environment for explorative test via docker image from dockerhub on azure webapp service
                        script{
                            //deploy environment for performance test via docker image from dockerhub on azure webapp service
                            azureWebAppPublish azureCredentialsId: 'azure', publishType: 'docker', resourceGroup: "moveezRG", appName: "${packageJSON.name}", slotName: "test", dockerImageName: "schdieflaw/${packageJSON.name}", skipDockerBuild: true, dockerImageTag: "${packageJSON.version}_${env.BUILD_ID}", dockerRegistryEndpoint: [credentialsId: 'dockerhub']
                            //check the deployment
                            retry(10) {
                                //give it time to pull the image and start the container
                                sleep time: 1, unit: 'MINUTES'
                                //trying to access URL
                                httpRequest responseHandle: 'NONE', url: 'http://test.moveez.de', validResponseCodes: '200', validResponseContent: 'Welcome'
                            }
                        }
                    },
                    'ACCEPTANCE': {
                        //deploy environment for acceptance test via docker image from dockerhub on azure webapp service
                        azureWebAppPublish azureCredentialsId: 'azure', publishType: 'docker', resourceGroup: "moveezRG", appName: "${packageJSON.name}", slotName: "functional", dockerImageName: "schdieflaw/${packageJSON.name}", dockerImageTag: "${packageJSON.version}_${env.BUILD_ID}", dockerRegistryEndpoint: [credentialsId: 'dockerhub', url: "https://registry.hub.docker.com"]
                        //check the deployment
                        retry(5) {
                            httpRequest responseHandle: 'NONE', url: 'http://moveez-functional.azurewebsites.net', validResponseCodes: '200', validResponseContent: 'Welcome'
                        }
                        //run acceptance test with cucumber and webdriverio
                        //sh "cd ./test/acceptance && ../../node_modules/.bin/wdio wdio.conf.js"
                    }
        		)
            }
        }
        stage('APPROVAL') {
            when {
                //only commits to master should be deployed to production (this conditions needs a multi-branch-pipeline)
                branch 'master'
            }
            steps {
                //approval from product owner
                input(message:'Go Live?', ok: 'Fire', submitter: config.approver)
                //abort all older builds waiting for approval
                milestone label: 'approval', ordinal: 1
            }
        }
    	stage('PROD') {
    		when {
    			//only commits to master should be deployed to production
    			branch 'master'
    		}
    		steps {
    			//deploy release to production via docker image from dockerhub on azure webapp service
                azureWebAppPublish azureCredentialsId: 'azure', publishType: 'docker', resourceGroup: "moveezRG", appName: "${packageJSON.name}", dockerImageName: "schdieflaw/${packageJSON.name}", dockerImageTag: "${packageJSON.version}_${env.BUILD_ID}", skipDockerBuild: true, dockerRegistryEndpoint: [credentialsId: 'dockerhub', url: "https://registry.hub.docker.com"]
                //check the deployment
                retry(10) {
                    //give it time to pull the image and start the container
                    sleep time: 1, unit: 'MINUTES'
                    //trying to access URL
                    httpRequest responseHandle: 'NONE', url: 'http://moveez.de', validResponseCodes: '200', validResponseContent: 'Welcome'
                }
            }
    	}*/
    }
}