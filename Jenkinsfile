pipeline {
  agent { node { label 'master' } }
  stages {
    stage('Build') {
      steps {
        sh 'cd app && npm install'
        sh "cd app && npm test"
      }
    }
  }
}