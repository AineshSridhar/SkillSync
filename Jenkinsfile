pipeline { 
  agent any

  environment {
    COMPOSE_FILE = 'docker-compose.yml'
    DOCKER_IMAGE = 'synergy-platform-app'
  }

  stages {
    stage('Prepare') {
      steps {
        sh 'docker --version || true'
        sh 'docker compose version || docker-compose --version || true'
        sh "docker compose -f ${COMPOSE_FILE} down --volumes --remove-orphans || true"
      } 
    }

    stage('Checkout') {
      steps { checkout scm }
    } 

    stage('Inject Env File') {
      steps {
        withCredentials([file(credentialsId: 'synergy-env', variable: 'ENV_FILE')]) {
          sh 'cp $ENV_FILE $WORKSPACE/.env'
        }
      }
    }

    stage('Build Image') {
        steps {
            withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                sh "docker build --progress=plain -t ${DOCKERHUB_USER}/${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                sh "docker tag ${DOCKERHUB_USER}/${DOCKER_IMAGE}:${BUILD_NUMBER} ${DOCKERHUB_USER}/${DOCKER_IMAGE}:latest"
            }
        }
    }

    stage('Start Services') {
      steps {
        sh "docker compose -f ${COMPOSE_FILE} up -d --remove-orphans"
      }
    }

    stage('Verify & Test') {
      steps {
        sh "docker ps -a"
        // sh "docker compose exec -T app npm test || docker run --rm ${DOCKER_IMAGE}:${BUILD_NUMBER} npm test"
        echo "Skipping test stage as no test script is defined"
      }
    }

    stage('Push to Registry') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
          sh 'echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin'
          sh "docker push ${DOCKERHUB_USER}/${DOCKER_IMAGE}:${BUILD_NUMBER}"
          sh "docker push ${DOCKERHUB_USER}/${DOCKER_IMAGE}:latest"
        }
      }
    }
  }

  post {
    always {
      sh "docker compose -f ${COMPOSE_FILE} down --volumes --remove-orphans || true"
      sh "docker image prune -f || true"
    }
  }
}
