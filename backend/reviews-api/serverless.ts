import type { AWS } from '@serverless/typescript';

import updateReviews from '@functions/updateReviews';
import scheduleReviews from '@functions/schedule';

const serverlessConfiguration: AWS = {
  service: 'review-alert-api',
  org: 'wimeki',
  frameworkVersion: '3',
  useDotenv: true,
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-dotenv-plugin', 'serverless-deployment-bucket'],
  provider: {
    name: 'aws',
    region: 'us-east-1',
    stage: "${opt:stage, 'dev'}",
    runtime: 'nodejs18.x',
    deploymentBucket: {
      name: 'review-alert-deployment-${self:provider.stage}',
      blockPublicAccess: true
    },
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeys: ['review-alert-key']
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      DB_URI: '${env:DB_URI}'
    }
  },
  // import the function via paths
  functions: { updateReviews, scheduleReviews },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: [],
      target: 'node18',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  }
};

module.exports = serverlessConfiguration;
