pipeline {
  agent {
    dockerfile {
      filename 'node'
    }
    
  }
  stages {
    stage('Build') {
      steps {
        sh 'cd app && npm test'
      }
    }
  }
}