import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';

export class RestBarWebappStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const env = scope.node.tryGetContext('env') || 'dev';

    const api = new apigateway.RestApi(this,"ApiHealthCheck",{
      restApiName:'Api for Restobar',
      description: 'This service is used to serve Lambda',
      deployOptions:{
        stageName:env
      }
    });

    const vpc = new ec2.Vpc(this,'vpc',{
      maxAzs:2,
      subnetConfiguration: [
        {
          subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name:"Private",
        },
        {
          subnetType:ec2.SubnetType.PUBLIC,
          name:"Public",
        }
      ]
    }) 

    const secret = new secretsmanager.Secret(this,"secret",{
      secretName: "rdsCredentials",
      generateSecretString:{
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password'
      }
    });

    const rdsSecuritygroup = new ec2.SecurityGroup(this,"rdsSecurtiyGroup",{
      vpc,
    })

    const rdsInstance= new rds.DatabaseInstance(this, "RdsInstance", {
      engine: rds.DatabaseInstanceEngine.postgres({version:rds.PostgresEngineVersion.VER_12_18}),
      // credentials: {
      //   username: secret.secretValueFromJson('username').toString(),
      //   password: secret.secretValueFromJson('password')
      // },
      credentials:rds.Credentials.fromSecret(secret),
      vpc,
      vpcSubnets:{
        subnetType:ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups:[rdsSecuritygroup],
      publiclyAccessible:false
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this,"LambdaSecurityGroup",{
      vpc
    })

    const lambdaFunction = new lambda.Function(this,"lambdaFunction",{
      runtime: lambda.Runtime.JAVA_17,
      handler:'com.rstobar.rest_bar_webapp.Handler::handleRequest',
      code: lambda.Code.fromAsset('../target/rest-bar-webapp-0.0.1-SNAPSHOT.jar'),
      functionName:'LambdaFunctionForRestoBar',
      vpc,
      securityGroups:[lambdaSecurityGroup],
      environment:{
        SECRET_NAME : secret.secretName,
        VPC_ID: vpc.vpcId,
      },
      timeout: cdk.Duration.seconds(20)
    })

    //Granting lambda access to read permission for the secret
    secret.grantRead(lambdaFunction);

    //Allowing lambda to connect with RDS
    rdsSecuritygroup.addIngressRule(lambdaSecurityGroup,ec2.Port.tcp(5432),'Allow Lambda to access to RDS');

    // Add IAM permissions for Lambda to manage security groups
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ec2:DescribeSecurityGroups',
        'ec2:RevokeSecurityGroupIngress',
        'ec2:RevokeSecurityGroupEgress',
      ],
      resources: ['*'], // Restrict further if needed
    }));


    const endpoint1 = api.root.addResource('healthstatus');
    endpoint1.addMethod('GET',new apigateway.LambdaIntegration(lambdaFunction));

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'RestBarWebappQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    
    
  }
}
