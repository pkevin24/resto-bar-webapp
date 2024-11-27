import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda'

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

    const lambdaFunction = new lambda.Function(this,"lambdaFunction",{
      runtime: lambda.Runtime.JAVA_17,
      handler:'com.rstobar.rest_bar_webapp.Handler::handleRequest',
      code: lambda.Code.fromAsset('../target/rest-bar-webapp-0.0.1-SNAPSHOT.jar'),
      functionName:'LambdaFunctionForRestoBar',
    })

    const endpoint1 = api.root.addResource('healthstatus');
    endpoint1.addMethod('GET',new apigateway.LambdaIntegration(lambdaFunction));

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'RestBarWebappQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    
    
  }
}
