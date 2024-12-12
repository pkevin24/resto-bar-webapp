import * as cdk from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { IGrantable } from 'aws-cdk-lib/aws-iam';

export interface SecretProps {
    secretName: string;
    generateSecretString: {
        secretStringTemplate: string,
        generateStringKey: string,
        excludeCharacters: string, 
    };
}

export class Secret extends cdk.Construct {
  public readonly secret: secretsmanager.Secret;

  constructor(scope: cdk.Construct, id: string, props: SecretProps) {
    super(scope, id);

    // Create the secret
    this.secret = new secretsmanager.Secret(scope, `${id}-${Date.now()}`, {
      secretName: props.secretName,
      generateSecretString: {
        secretStringTemplate: props.generateSecretString.secretStringTemplate,
        generateStringKey: props.generateSecretString.generateStringKey,
        excludeCharacters: props.generateSecretString.excludeCharacters,
      }
    });
  }

  grantRead(grantee: IGrantable): void {
    if (this.secret) {
      this.secret.grantRead(grantee);
    } else {
      console.error('Secret is not properly initialized.');
    }
  }
}
