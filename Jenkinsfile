// pipeline {
//     agent any

//     environment {
//         DOCKER_COMPOSE_FILE = "docker-compose.yml"
//     }

//     stages {
//         stage('Checkout') {
//             steps {
//                 script {
//                     // Checkout the code
//                     checkout([$class: 'GitSCM', 
//                               branches: [[name: '*/main']], 
//                               userRemoteConfigs: [[url: 'https://github.com/AshwinK01/Capstone-2']]])
//                 }
//             }
//         }

//         stage('Build and Run Docker Compose') {
//             steps {
//                 script {
//                     // Use 'docker-compose' commands compatible with both Linux and Windows
//                     if (isUnix()) {
//                         sh 'docker-compose up --build -d'  // Build and run in detached mode
//                     } else {
//                         bat 'docker-compose up --build -d'
//                     }
//                 }
//             }
//         }
//     }

//     post {
//         success {
//             echo 'Containers are up and running'
//         }
//         failure {
//             echo 'Build failed. Check for errors.'
//         }
//     }
// }

pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
        // Add environment variables for Docker socket permissions
        DOCKER_SOCKET = '/var/run/docker.sock'
    }
    
    stages {
        stage('Setup Environment') {
            steps {
                script {
                    // Check and setup Docker permissions
                    sh '''
                        if [ ! -x "$(command -v docker)" ]; then
                            echo "Docker is not installed. Installing Docker..."
                            curl -fsSL https://get.docker.com -o get-docker.sh
                            sudo sh get-docker.sh
                        fi
                        
                        # Ensure Jenkins user has Docker permissions
                        if ! groups jenkins | grep -q docker; then
                            sudo usermod -aG docker jenkins
                            echo "Added Jenkins user to Docker group. You may need to restart Jenkins."
                        fi
                        
                        # Verify Docker installation
                        docker --version || true
                        docker-compose --version || true
                    '''
                }
            }
        }

        stage('Checkout') {
            steps {
                script {
                    try {
                        checkout([
                            $class: 'GitSCM', 
                            branches: [[name: '*/main']], 
                            userRemoteConfigs: [[
                                url: 'https://github.com/AshwinK01/Capstone-2'
                            ]]
                        ])
                    } catch (Exception e) {
                        echo "Checkout failed: ${e.getMessage()}"
                        error "Checkout stage failed"
                    }
                }
            }
        }
        
        stage('Verify Docker Compose') {
            steps {
                script {
                    if (!fileExists(env.DOCKER_COMPOSE_FILE)) {
                        error "Docker Compose file not found: ${env.DOCKER_COMPOSE_FILE}"
                    }
                    
                    // Validate docker-compose file
                    sh '''
                        echo "Validating Docker Compose file..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} config
                    '''
                }
            }
        }
        
        stage('Build and Run Docker Compose') {
            steps {
                script {
                    try {
                        // Stop any existing containers
                        sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down || true'
                        
                        // Remove existing images to ensure fresh build
                        sh '''
                            docker-compose -f ${DOCKER_COMPOSE_FILE} down --rmi all || true
                            docker system prune -f || true
                        '''
                        
                        // Build and start containers with increased verbosity
                        sh '''
                            docker-compose -f ${DOCKER_COMPOSE_FILE} build --no-cache
                            docker-compose -f ${DOCKER_COMPOSE_FILE} up -d --force-recreate
                        '''
                        
                        // Verify containers are running
                        sh '''
                            echo "Checking running containers..."
                            docker ps
                            echo "Checking container logs..."
                            docker-compose -f ${DOCKER_COMPOSE_FILE} logs
                        '''
                    } catch (Exception e) {
                        echo "Docker Compose build failed: ${e.getMessage()}"
                        sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} logs'
                        error "Build and Run stage failed"
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    // Wait for services to be healthy
                    sh '''
                        echo "Waiting for services to be ready..."
                        sleep 30
                        
                        # Check if backend is responding
                        curl -f http://localhost:5000 || echo "Backend health check failed"
                        
                        # Check if frontend is responding
                        curl -f http://localhost:3000 || echo "Frontend health check failed"
                        
                        # Show container status
                        docker-compose -f ${DOCKER_COMPOSE_FILE} ps
                    '''
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo 'Deployment completed successfully'
                emailext(
                    subject: "✅ Jenkins Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        Pipeline executed successfully!
                        
                        Build URL: ${env.BUILD_URL}
                        Job: ${env.JOB_NAME}
                        Build Number: ${env.BUILD_NUMBER}
                        
                        Services:
                        - Frontend: http://localhost:3000
                        - Backend: http://localhost:5000
                    """,
                    to: 'sanjay.kohli21@st.niituniversity.in'
                )
            }
        }
        failure {
            script {
                echo 'Collecting failure diagnostics...'
                
                // Collect diagnostic information
                sh '''
                    echo "Docker Version:"
                    docker --version || true
                    
                    echo "Docker Compose Version:"
                    docker-compose --version || true
                    
                    echo "Container Status:"
                    docker-compose -f ${DOCKER_COMPOSE_FILE} ps || true
                    
                    echo "Container Logs:"
                    docker-compose -f ${DOCKER_COMPOSE_FILE} logs || true
                '''
                
                emailext(
                    subject: "❌ Jenkins Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        Pipeline failed!
                        
                        Build URL: ${env.BUILD_URL}
                        Job: ${env.JOB_NAME}
                        Build Number: ${env.BUILD_NUMBER}
                        
                        Please check the build logs for more details.
                    """,
                    to: 'sanjay.kohli21@st.niituniversity.in'
                )
            }
        }
        always {
            script {
                // Cleanup
                sh '''
                    echo "Performing cleanup..."
                    docker-compose -f ${DOCKER_COMPOSE_FILE} down --volumes --remove-orphans || true
                    docker system prune -f || true
                '''
            }
        }
    }
}

