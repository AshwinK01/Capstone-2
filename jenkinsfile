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
                    // Checkout the code
                    checkout([$class: 'GitSCM', 
                              branches: [[name: '*/main']], 
                              userRemoteConfigs: [[url: 'https://github.com/AshwinK01/Capstone-2']]])
                }
            }
        }

        stage('Build and Run Docker Compose') {
            steps {
                script {
                    // Use 'docker-compose' commands compatible with both Linux and Windows
                    if (isUnix()) {
                        sh 'docker-compose up --build -d'  // Build and run in detached mode
                    } else {
                        bat 'docker-compose up --build -d'
                    }
                }
            }
        }
    }

    post {
        success {
            emailext(
                subject: "✅ Jenkins Build Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Pipeline executed successfully!",
                to: 'sanjay.kohli21@st.niituniversity.in'
            )
        }
        failure {
            emailext(
                subject: "❌ Jenkins Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Pipeline failed. Please check the build logs.",
                to: 'sanjay.kohli21@st.niituniversity.in'
            )
        }
        always {
            sh '''
                pkill -f "python app.py" || true
                pkill -f "npm run dev" || true
                rm -rf Backend/venv || true
                rm -rf frontend_next/node_modules || true
            '''
        }
    }
}

