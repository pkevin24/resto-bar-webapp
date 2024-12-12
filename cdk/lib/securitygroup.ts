import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface SecurityGroupProps {
    vpc: IVpc;
    description?:string,
    allowAllOutbound?:boolean
}

export class SecurityGroup extends cdk.Construct {
    public readonly securityGroup: ec2.SecurityGroup; 

    constructor(scope: cdk.Construct, id: string, props: SecurityGroupProps) {
        super(scope, id);

        this.securityGroup = new ec2.SecurityGroup(this, id, {
            vpc: props.vpc,
            description:props.description,
            allowAllOutbound:props.allowAllOutbound
        });
    }

    public addIngressRule(peer: ec2.IPeer, port: ec2.Port, description?: string) {
        this.securityGroup.addIngressRule(peer, port, description);
    }

    public addEgressRule(peer: ec2.IPeer, port: ec2.Port, description?: string) {
        this.securityGroup.addEgressRule(peer, port, description);
    }
}
