import * as cdk from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export interface VpcProps {
    maxAzs:number,
    subnetConfiguration:ec2.SubnetConfiguration[],
}

export class Vpc extends cdk.Construct {
 public readonly vpc: ec2.Vpc;
  constructor(scope: cdk.Construct, id: string, props: VpcProps) {
    super(scope, id);
    this.vpc=this.BuildVpc(scope,id,props);
    
  }
  BuildVpc = function(scope: cdk.Construct, id: string, props: VpcProps):ec2.Vpc{
    const vpc = new ec2.Vpc(scope,`${id}-Vpc`,{
        maxAzs:props.maxAzs,
        subnetConfiguration: props.subnetConfiguration
    }) ;
    return vpc;
  }
}

