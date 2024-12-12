import * as cdk from 'constructs';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'

export interface ApiGatewayProps {
    restApiName: string,
    description: string,
    deployOptions: {
        stageName: string,
    }
}

export class ApiGateway extends cdk.Construct {
    public readonly root: apiGateway.IResource;

    constructor(scope: cdk.Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        const api = new apiGateway.RestApi(this, id, {
            restApiName: props.restApiName,
            description: props.description,
            deployOptions: props.deployOptions,
        });
        this.root = api.root; // Assign the root for external access
    }

}