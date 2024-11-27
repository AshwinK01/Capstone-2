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
        NODE_VERSION = '16.14.0'
        PYTHON_VERSION = '3.8'
    }
    
    stages {
        stage('Setup Environment') {
            steps {
                script {
                    // Setup Node.js environment
                    sh '''
                        # Install nvm if not present
                        if [ ! -d "$HOME/.nvm" ]; then
                            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
                            export NVM_DIR="$HOME/.nvm"
                            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
                        fi
                        
                        # Install and use specified Node.js version
                        . "$HOME/.nvm/nvm.sh"
                        nvm install ${NODE_VERSION}
                        nvm use ${NODE_VERSION}
                        
                        # Install Python virtual environment tools
                        python3 -m pip install --user virtualenv
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
        
        stage('Build Backend') {
            steps {
                dir('Backend') {
                    script {
                        try {
                            sh '''
                                # Create and activate virtual environment
                                python3 -m virtualenv venv
                                . venv/bin/activate
                                
                                # Install requirements
                                pip install -r requirements.txt
                                
                                # Start the backend server in the background
                                nohup python app.py > backend.log 2>&1 &
                                
                                # Wait for backend to start
                                sleep 10
                                
                                # Check if backend is running
                                if ! ps aux | grep "[p]ython app.py"; then
                                    echo "Backend failed to start"
                                    cat backend.log
                                    exit 1
                                fi
                            '''
                        } catch (Exception e) {
                            echo "Backend build failed: ${e.getMessage()}"
                            sh 'cat backend.log || true'
                            error "Backend build stage failed"
                        }
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('frontend_next') {
                    script {
                        try {
                            sh '''
                                # Source nvm and use correct Node version
                                . "$HOME/.nvm/nvm.sh"
                                nvm use ${NODE_VERSION}
                                
                                # Install dependencies
                                npm install
                                
                                # Build the application
                                npm run build
                                
                                # Start the frontend server in the background
                                nohup npm run dev > frontend.log 2>&1 &
                                
                                # Wait for frontend to start
                                sleep 20
                                
                                # Check if frontend is running
                                if ! ps aux | grep "[n]pm run dev"; then
                                    echo "Frontend failed to start"
                                    cat frontend.log
                                    exit 1
                                fi
                            '''
                        } catch (Exception e) {
                            echo "Frontend build failed: ${e.getMessage()}"
                            sh 'cat frontend.log || true'
                            error "Frontend build stage failed"
                        }
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    sh '''
                        echo "Checking backend health..."
                        curl -f http://localhost:5000 || echo "Backend health check failed"
                        
                        echo "Checking frontend health..."
                        curl -f http://localhost:3000 || echo "Frontend health check failed"
                    '''
                }
            }
        }
    }
    
    post {
        success {
            script {
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
                // Cleanup processes
                sh '''
                    echo "Cleaning up processes..."
                    pkill -f "python app.py" || true
                    pkill -f "npm run dev" || true
                    
                    # Clean up virtual environment
                    rm -rf Backend/venv || true
                    
                    # Clean up node_modules
                    rm -rf frontend_next/node_modules || true
                '''
            }
        }
    }
}
