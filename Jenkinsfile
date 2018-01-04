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
        label "master"
    }
    stages {
        stage('INIT') {
            steps {
                script {
                    //load pipeline configuration
                    config = load 'config/config.jenkins'
                    packageJSON = readJSON file: 'package.json'
                    //!create a long release name for archiving with job name, version, build number
                    // and commit id, e. g. PetClinic_1.3.1_12_e4655456j
                    releaseName = "${packageJSON.name}_${packageJSON.version}_${env.BUILD_NUMBER}_${env.GIT_COMMIT}"
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
                }
            }
        }
        stage('BUILD') {
            steps {
                script {
                    //create docker image and push it to dockerhub
        		    docker.withRegistry('https://registry.hub.docker.com/', 'dockerhub') {
        			    def dockerImage = docker.build("schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_ID}")
        			    dockerImage.push("latest")
        		    }
                }
            }
        }
        stage('UAT') {
            steps {
                //deploy environment for explorative tests
                //create plan for webapp
                //deploy docker image from dockerhub
                //TODO login into private registry open
                //az webapp create --resource-group moveez --plan moveezPlan --name ${releaseName} --deployment-container-image-name schdieflaw/${packageJSON.name}:${packageJSON.version}_${env.BUILD_ID}
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
                //destroy explorative environment
            }
        }
    }
}
