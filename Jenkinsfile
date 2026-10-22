pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '931112878329'
        ECR_REPOSITORY = 'agrirescue-backend'
        IMAGE_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh 'docker --version'
                sh 'aws --version'
            }
        }

        stage('Build Image') {
            steps {
                sh '''
                    docker build \
                      -t "$ECR_REPOSITORY:$IMAGE_TAG" \
                      ./backend
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-ecr-credentials',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    sh '''
                        set +x
                        export AWS_DEFAULT_REGION="$AWS_REGION"
                        aws ecr get-login-password \
                          --region "$AWS_REGION" \
                        | docker login \
                          --username AWS \
                          --password-stdin \
                          "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
                    '''
                }
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    docker tag \
                      "$ECR_REPOSITORY:$IMAGE_TAG" \
                      "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"

                    docker push \
                      "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
                '''
            }
        }
    }

    post {
        success {
            echo 'AgriRescue image built and pushed to Amazon ECR successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the stage logs to identify the issue.'
        }
    }
}
