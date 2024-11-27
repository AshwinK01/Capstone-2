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
                    // Checkout the code from GitHub
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
                        sh 'docker-compose -f $DOCKER_COMPOSE_FILE up --build -d'  // Build and run in detached mode for Unix-based systems
                    } else {
                        bat 'docker-compose -f %DOCKER_COMPOSE_FILE% up --build -d'  // Windows-compatible syntax
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Containers are up and running'
            sendConfirmationEmail()
        }
        failure {
            echo 'Build failed. Check for errors.'
            sendErrorEmail()
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
