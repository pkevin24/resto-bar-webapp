import {Construct} from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib'

export interface RdsInstanceProps {
    engine: rds.IInstanceEngine,
      credentials: rds.Credentials,    
      instanceType: ec2.InstanceType,
      allocatedStorage: number,
      maxAllocatedStorage: number,
      vpc:ec2.IVpc,
      vpcSubnets: ec2.SubnetSelection
      securityGroups: ec2.ISecurityGroup[] ,
      publiclyAccessible: boolean,
      storageType: rds.StorageType,
      backupRetention: cdk.Duration,
}

export class RdsInstance extends Construct {
  constructor(scope: Construct, id: string, props: RdsInstanceProps) {
    super(scope, id);
    const uniqueSecretId = `${id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.BuildRdsInstance(scope,uniqueSecretId,props);
    
  }

  BuildRdsInstance = function (scope: Construct, id: string, props: RdsInstanceProps){
    const rdsInstance = new rds.DatabaseInstance(scope, id, {
        engine: props.engine,
        credentials: props.credentials,
        instanceType:props.instanceType,
        allocatedStorage: props.allocatedStorage,
        maxAllocatedStorage: props.maxAllocatedStorage,
        vpc:props.vpc,
        vpcSubnets: props.vpcSubnets,
        securityGroups: props.securityGroups,
        publiclyAccessible: props.publiclyAccessible,
        storageType: props.storageType,
        backupRetention: props.backupRetention,
      });

      return rdsInstance;
  }
}