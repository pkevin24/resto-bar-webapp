#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RestBarWebappStack } from '../lib/rest-bar-webapp-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env') || 'dev';
const stackName = `restobar-webapp-cf-${env}`;
new RestBarWebappStack(app, `${stackName}`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  
});