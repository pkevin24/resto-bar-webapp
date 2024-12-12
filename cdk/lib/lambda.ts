import {Construct} from 'constructs';
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface LambdaProps {
    runtime: cdk.aws_lambda.Runtime,
      handler: string,
      code:cdk.aws_lambda.Code,
      functionName: string,
      vpc:ec2.IVpc,
      securityGroups: ec2.ISecurityGroup[] ,
      environment: { [key: string]: string },
      timeout: cdk.Duration,
      role:cdk.aws_iam.Role
}

export class Lambda extends Construct {
    public readonly function: lambda.Function;
  role: any;
  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);
    const uniqueSecretId = `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.function=this.BuildLambdaFunction(scope,uniqueSecretId,props);    
  }

  BuildLambdaFunction = function (scope: Construct, id: string, props: LambdaProps){
    const lambdaFunction = new lambda.Function(scope,id, {
        runtime: props.runtime,
        handler: props.handler,
        code: props.code,
        functionName:props.functionName,
        vpc:props.vpc,
        securityGroups: props.securityGroups,
        environment: props.environment,
        timeout: props.timeout,
        role: props.role
      });
      console.log(props.role);

      return lambdaFunction;
  }
}