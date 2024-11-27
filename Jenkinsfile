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
        // Add Docker credentials if needed
        DOCKER_REGISTRY_CREDENTIALS = credentials('docker-hub-credentials')
    }
    
    tools {
        // Ensure specific tools are available
        dockerTool 'docker'
    }
    
    stages {
        stage('Checkout') {
            steps {
                // More robust checkout with error handling
                script {
                    try {
                        checkout([
                            $class: 'GitSCM', 
                            branches: [[name: '*/main']], 
                            userRemoteConfigs: [[
                                url: 'https://github.com/AshwinK01/Capstone-2',
                                // Uncomment and add credentials if the repo is private
                                // credentialsId: 'your-github-credentials'
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
                    // More comprehensive Docker Compose handling
                    try {
                        // Login to Docker registry if needed
                        // sh 'echo $DOCKER_REGISTRY_CREDENTIALS_PSW | docker login -u $DOCKER_REGISTRY_CREDENTIALS_USR --password-stdin'
                        
                        // Verbose Docker Compose commands with error checking
                        if (isUnix()) {
                            sh '''
                                docker-compose -f ${DOCKER_COMPOSE_FILE} config
                                docker-compose -f ${DOCKER_COMPOSE_FILE} pull
                                docker-compose -f ${DOCKER_COMPOSE_FILE} up --build -d
                            '''
                        } else {
                            bat '''
                                docker-compose -f %DOCKER_COMPOSE_FILE% config
                                docker-compose -f %DOCKER_COMPOSE_FILE% pull
                                docker-compose -f %DOCKER_COMPOSE_FILE% up --build -d
                            '''
                        }
                        
                        // Verify containers are running
                        sh 'docker ps'
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
                    // Add custom health checks or verification steps
                    sh '''
                        # Example: Check if specific containers are running
                        docker-compose -f ${DOCKER_COMPOSE_FILE} ps
                        
                        # Example: Curl a health endpoint if applicable
                        # curl http://localhost:8080/health
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
            // Clean up resources
            script {
                sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down || true'
                
                // Optional: Prune unused Docker resources
                sh '''
                    docker system prune -f
                    docker volume prune -f
                '''
            }
        }
    }
}

// Email notification methods
def sendConfirmationEmail() {
    emailext(
        subject: "Jenkins Build Success: ${env.JOB_NAME} ${env.BUILD_NUMBER}",
        body: """
        Build Successful!
        
        Job: ${env.JOB_NAME}
        Build Number: ${env.BUILD_NUMBER}
        Build URL: ${env.BUILD_URL}
        
        The Jenkins pipeline has successfully completed. 
        All containers are up and running.
        """,
        to: 'sanjay.kohli21@st.niituniversity.in'
    )
}

def sendErrorEmail() {
    emailext(
        subject: "Jenkins Build Failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}",
        body: """
        Build Failed!
        
        Job: ${env.JOB_NAME}
        Build Number: ${env.BUILD_NUMBER}
        Build URL: ${env.BUILD_URL}
        
        There was an error in the Jenkins pipeline. 
        Please check the build logs for detailed error information.
        
        Recommended actions:
        1. Check Docker Compose configuration
        2. Verify network and port availability
        3. Check container image compatibility
        """,
        to: 'sanjay.kohli21@st.niituniversity.in'
    )
}
