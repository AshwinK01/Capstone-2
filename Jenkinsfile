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
    }
    
    stages {
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
                    // Check if docker-compose file exists
                    if (!fileExists(env.DOCKER_COMPOSE_FILE)) {
                        error "Docker Compose file not found: ${env.DOCKER_COMPOSE_FILE}"
                    }
                    
                    // Print the contents of the file for debugging
                    sh "cat ${env.DOCKER_COMPOSE_FILE}"
                }
            }
        }
        
        stage('Build and Run Docker Compose') {
            steps {
                script {
                    try {
                        // Verbose Docker Compose commands with error checking
                        sh '''
                            # Verify Docker and Docker Compose installation
                            docker --version
                            docker-compose --version
                            
                            # Validate Docker Compose configuration
                            docker-compose -f ${DOCKER_COMPOSE_FILE} config
                            
                            # Pull latest images
                            docker-compose -f ${DOCKER_COMPOSE_FILE} pull
                            
                            # Build and start containers
                            docker-compose -f ${DOCKER_COMPOSE_FILE} up --build -d
                            
                            # List running containers
                            docker ps
                        '''
                    } catch (Exception e) {
                        echo "Docker Compose build failed: ${e.getMessage()}"
                        
                        // Additional debugging
                        sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} logs'
                        
                        error "Build and Run stage failed"
                    }
                }
            }
        }
        
        stage('Post-Deployment Verification') {
            steps {
                script {
                    sh '''
                        # Check container status
                        docker-compose -f ${DOCKER_COMPOSE_FILE} ps
                    '''
                }
            }
        }
    }
    
    post {
        success {
            script {
                echo 'Containers are up and running successfully'
                sendConfirmationEmail()
            }
        }
        failure {
            script {
                echo 'Build failed. Collecting diagnostic information.'
                sendErrorEmail()
            }
        }
        always {
            script {
                sh '''
                    # Attempt to stop and remove containers
                    docker-compose -f ${DOCKER_COMPOSE_FILE} down || true
                    
                    # Optional cleanup
                    docker system prune -f
                '''
            }
        }
    }
}

def sendConfirmationEmail() {
    emailext(
        subject: "Jenkins Build Success: ${env.JOB_NAME} ${env.BUILD_NUMBER}",
        body: "The Jenkins pipeline has successfully completed. The containers are up and running.",
        to: 'sanjay.kohli21@st.niituniversity.in'
    )
}

def sendErrorEmail() {
    emailext(
        subject: "Jenkins Build Failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}",
        body: "There was an error in the Jenkins pipeline. Please check the build logs for details.",
        to: 'sanjay.kohli21@st.niituniversity.in'
    )
}

