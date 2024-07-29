import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as dotenv from "dotenv";

dotenv.config();

export class DeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define a new VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'ApplicationVPC', {
      maxAzs: 2, // Default is all AZs in the region
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create a security group for the RDS instance
    const securityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access'
    );

    // Create RDS PostgreSQL

    const rdsInstance = new rds.DatabaseInstance(this, 'CartRDS', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroups: [securityGroup],
      multiAz: false,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      cloudwatchLogsExports: ['postgresql'],
      deleteAutomatedBackups: true,
      backupRetention: cdk.Duration.days(0),
      deletionProtection: false,
      databaseName: process.env.DB_NAME!,
      publiclyAccessible: true,
      credentials: rds.Credentials.fromPassword(
        process.env.DB_USERNAME!,
        cdk.SecretValue.unsafePlainText(process.env.DB_PASSWORD!)
      ),
    });

    new cdk.CfnOutput(this, 'RDS_URL', {
      value: rdsInstance.dbInstanceEndpointAddress,
    });
    
    // Create the Lambda function
    const lambdaFunction = new NodejsFunction(this, 'CartAPILambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: 'nodejs-aws-cart-api',
      entry: 'dist/main.js',
      environment: {
        DB_HOST: rdsInstance.dbInstanceEndpointAddress,
        DB_PORT: rdsInstance.dbInstanceEndpointPort,
        DB_NAME: process.env.DB_NAME!,
        DB_USERNAME: process.env.DB_USERNAME!,
        DB_PASSWORD: process.env.DB_PASSWORD!,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
    });

    rdsInstance.grantConnect(lambdaFunction, process.env.DB_USERNAME!);

    const function_url = lambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
      },
    });
    new cdk.CfnOutput(this, 'LambdaFunctionUrl', { value: function_url.url });
  }
}
