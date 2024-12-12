import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ApiGateway, ApiGatewayProps } from './api';
import { Vpc, VpcProps } from './vpc';
import { Secret, SecretProps } from './secret';
import { SecurityGroup, SecurityGroupProps } from './securitygroup';
import { RdsInstance, RdsInstanceProps } from './rds';
import { Lambda, LambdaProps } from './lambda';
import { ec2Instance, ec2InstanceProps } from './ec2';

export class RestBarWebappStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const env = scope.node.tryGetContext('env') || 'dev';
    const myPublicIP = this.node.tryGetContext('ipAdr');
    if (!myPublicIP) {
      throw new Error("Public IP is not set.");
    }

    // API Gateway configuration
    let apiProps: ApiGatewayProps = {
      restApiName: 'Api for Restobar',
      description: 'This service is used to serve Lambda',
      deployOptions: {
        stageName: env,
      }
    }

    const api = new ApiGateway(this, `Apigateway1-${env}`, apiProps);

    // VPC configuration
    let vpcProp: VpcProps = {
      maxAzs: 2,
      subnetConfiguration: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, name: "Private" },
        { subnetType: ec2.SubnetType.PUBLIC, name: "Public" }
      ]
    }

    const customVpc = new Vpc(this, 'CustomVpc', vpcProp);

    // Secrets Manager configuration
    let secretProps: SecretProps = {
      secretName: "rdsCredentials",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludeCharacters: '/@" ',
      }
    }

    const secret = new Secret(this, `Secret-${env}-${Date.now()}`, secretProps);
    if (!secret || !secret.secret) {
      throw new Error('Secret is not properly initialized.');
    }

    // RDS Security Group configuration
    let rdsSecurityGroupProps: SecurityGroupProps = { vpc: customVpc.vpc };
    const rdsSecuritygroup = new SecurityGroup(this, "rdsSecurityGroup", rdsSecurityGroupProps);

    // RDS instance configuration
    let rdsInstanceProps: RdsInstanceProps = {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_12_18 }),
      credentials: rds.Credentials.fromSecret(secret.secret),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      vpc: customVpc.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [rdsSecuritygroup.securityGroup],
      publiclyAccessible: false,
      storageType: rds.StorageType.GP2,
      backupRetention: cdk.Duration.days(1),
    }

    const rdsInstance = new RdsInstance(this, "RdsInstance", rdsInstanceProps);

    // Lambda Security Group configuration
    let lambdaSecurityGroupProps: SecurityGroupProps = { vpc: customVpc.vpc };
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", lambdaSecurityGroupProps);

    // Lambda Execution Role
    let lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),  // Fix policy ARN
      ],
    });
    
    // Add EC2 network interface management permissions for Lambda
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface',
      ],
      resources: ['*'], // You can restrict resources further if needed
    }));
    

    // Lambda function configuration
    let lambdaFunctionProps: LambdaProps = {
      runtime: lambda.Runtime.JAVA_17,
      handler: 'com.rstobar.rest_bar_webapp.Handler::handleRequest',
      code: lambda.Code.fromAsset('../target/rest-bar-webapp-0.0.1-SNAPSHOT.jar'),
      functionName: 'LambdaFunctionForRestoBar',
      vpc: customVpc.vpc,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        SECRET_NAME: secret.secret.secretName,
        VPC_ID: customVpc.vpc.vpcId,
      },
      timeout: cdk.Duration.seconds(20),
      role: lambdaRole
    }

    const lambdaFunction = new Lambda(this, "lambdaFunction", lambdaFunctionProps);

    // Granting lambda access to read permission for the secret
    secret.grantRead(lambdaRole);

    // API Gateway - health status endpoint
    const endpoint1 = api.root.addResource('healthstatus');
    endpoint1.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction.function));

    // Bastion Host Security Group configuration
    let bastionSecurityGroupProps: SecurityGroupProps = { vpc: customVpc.vpc };
    const bastionSecurityGroup = new ec2.SecurityGroup(this, "bastionSecurityGroup", bastionSecurityGroupProps);

    // Allow SSH access from local to bastion host
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(myPublicIP + '/32'),
      ec2.Port.tcp(22),
      'Allow SSH access from my IP'
    );

    // Allow Lambda to connect with RDS
    rdsSecuritygroup.addIngressRule(lambdaSecurityGroup, ec2.Port.tcp(5432), 'Allow Lambda to access RDS');

    // Allow Bastion host to connect to RDS
    rdsSecuritygroup.addIngressRule(bastionSecurityGroup, ec2.Port.tcp(5432), 'Allow Bastion Host to access RDS');

    // Bastion Host configuration
    let bastionHostProp: ec2InstanceProps = {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2, 
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: customVpc.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSecurityGroup,
      keyName: "rdsJumpBox",
    }

    const bastionHost = new ec2Instance(this, "BastionHost", bastionHostProp);
  }
}
