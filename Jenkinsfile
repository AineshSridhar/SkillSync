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

        stage('UI Tests - Selenium') {
      steps {
        sh "docker compose -f ${COMPOSE_FILE} exec -T app pytest tests/selenium/"
      }
    }

    stage('Monitor with Prometheus & Grafana') {
      steps {
        echo "Prometheus at http://localhost:9090"
        echo "Grafana at http://localhost:3001 (default login: admin/admin)"
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
