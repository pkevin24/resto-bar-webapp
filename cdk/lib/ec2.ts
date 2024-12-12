import {Construct} from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import {IVpc}  from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

export interface ec2InstanceProps {
    instanceType: ec2.InstanceType;
    machineImage: ec2.IMachineImage;
    vpc: IVpc;
    vpcSubnets?: ec2.SubnetSelection;
    securityGroup: ec2.SecurityGroup;
    keyName: string;
}

export class ec2Instance extends Construct {
  constructor(scope: Construct, id: string, props: ec2InstanceProps) {
    super(scope, id);
    const uniqueSecretId = `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.BuildEC2Instance(scope,uniqueSecretId,props);
    
  }

  BuildEC2Instance = function (scope: Construct, id: string, props: ec2InstanceProps){
    const ec2Host = new ec2.Instance(scope, id, {
        instanceType: props.instanceType,
        machineImage: props.machineImage,
        vpc:props.vpc,
        vpcSubnets: props.vpcSubnets,
        securityGroup: props.securityGroup,
        keyName: props.keyName, 
      });

      return ec2Host;
  }
  
}