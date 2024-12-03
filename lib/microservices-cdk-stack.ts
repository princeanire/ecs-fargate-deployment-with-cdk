import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {
  RabbitMqBrokerEngineVersion,
  RabbitMqBrokerInstance,
} from "@cdklabs/cdk-amazonmq";
import { WafwebaclToAlb } from "@aws-solutions-constructs/aws-wafwebacl-alb";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ses from "aws-cdk-lib/aws-ses";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { FargateServiceConfig } from "./fargate-service-config";
import * as amazonmq from "aws-cdk-lib/aws-amazonmq";

export class MicroservicesCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sharedVirtualPrivateCloud = ec2.Vpc.fromVpcAttributes(
      this,
      this.node.tryGetContext("VPC_IDENTIFIER"),
      {
        vpcId: this.node.tryGetContext("VPC_IDENTIFIER"),
        availabilityZones: this.node.tryGetContext("AVAILABILITY_ZONES"),
        privateSubnetIds: this.node.tryGetContext("APP_SUBNETS"),
        isolatedSubnetIds: this.node.tryGetContext("DATA_SUBNETS"),
        publicSubnetIds: this.node.tryGetContext("PUBLIC_SUBNETS"),
      }
    );

    /* const sharedDatabase = new rds.DatabaseInstance(
      this,
      "OMMicroservicesSharedDatabase",
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_4,
        }),
        vpc: sharedVirtualPrivateCloud,
        instanceType: new ec2.InstanceType(
          this.node.tryGetContext("DB_INSTANCE_TYPE")
        ),
        storageEncrypted: true,
        multiAz: this.node.tryGetContext("MULTI_AZ_DEPLOYMENT"),
        backupRetention: cdk.Duration.days(7),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        storageType: rds.StorageType.GP3,
        instanceIdentifier: this.node.tryGetContext("DB_IDENTIFIER"),
        credentials: rds.Credentials.fromGeneratedSecret(
          this.node.tryGetContext("DB_ADMIN_USERNAME")
        ),
        deletionProtection: this.node.tryGetContext("DELETION_PROTECTION"),
      }
    );
 */
    const sharedPublicCertificate = new acm.Certificate(
      this,
      `${this.node.tryGetContext("NAME_PREFIX")}MicroservicesSharedCertificate`,
      {
        domainName: this.node.tryGetContext("CERTIFICATE_DOMAIN_NAME"),
        validation: acm.CertificateValidation.fromDns(),
      }
    );

    const sharedLoadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${this.node.tryGetContext(
        "NAME_PREFIX"
      )}MicroservicesSharedApplicationLoadBalancer`,
      {
        vpc: sharedVirtualPrivateCloud,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    /*  const SharedWebApplicationFirewall = new WafwebaclToAlb(
      this,
      "OMMicroservicesSharedWebApplicationFirewall",
      {
        existingLoadBalancerObj: sharedLoadBalancer
      }
    ); */

    /* const sharedRabbitMQMessageBrokerSecret = new secretsmanager.Secret(
      this,
      "OMMicroservicesSharedRabbitMQMessageBrokerSecret",
      {
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: "administrator" }),
          generateStringKey: "password",
          excludeCharacters: '/@",:=',
        },
      }
    );
 */
    /* const sharedRabbitMQMessageBroker = new RabbitMqBrokerInstance(
      this,
      "OMMicroservicesSharedRabbitMQMessageBroker",
      {
        publiclyAccessible: false,
        instanceType: this.node.tryGetContext("RABBITMQ_INSTANCE_TYPE"),
        vpc: sharedVirtualPrivateCloud,
        vpcSubnets: {
          subnets: [sharedVirtualPrivateCloud.isolatedSubnets[0]],
        },
        brokerName: this.node.tryGetContext("RABBITMQ_BROKER_NAME"),
        version: RabbitMqBrokerEngineVersion.V3_13,
        autoMinorVersionUpgrade: true,
        admin: {
          username: sharedRabbitMQMessageBrokerSecret
            .secretValueFromJson("username")
            .unsafeUnwrap(),
          password:
            sharedRabbitMQMessageBrokerSecret.secretValueFromJson("password"),
        },
      }
    );
 */
    /* const sharedECRContainerImageRepository = new ecr.Repository(
      this,
      "OMMicroservicesSharedECRContainerImageRepository",
      {
        imageScanOnPush: true,
        encryption: ecr.RepositoryEncryption.AES_256,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
 */
    /* const sharedS3FileStorage = new s3.Bucket(
      this,
      this.node.tryGetContext("S3_BUCKET_NAME"),
      {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
      }
    ); */

    /* const noReplyRRHIAppsPHEmailDomainIdentity = ses.Identity.domain(
      this.node.tryGetContext("EMAIL_DOMAIN_NAME")
    );

    const sharedSESEmailIdentity = new ses.EmailIdentity(
      this,
      "OMMicroservicesSharedSESEmailIdentity",
      {
        identity: noReplyRRHIAppsPHEmailDomainIdentity,
      }
    ); */

    const fargateServiceConfigs = this.node.tryGetContext(
      "FARGATE_SERVICES"
    ) as FargateServiceConfig[];

    fargateServiceConfigs.forEach(
      (fargateServiceConfig: FargateServiceConfig) => {
        let loadBalancedFargateService =
          new ecsPatterns.ApplicationLoadBalancedFargateService(
            this,
            `${fargateServiceConfig.SERVICE_NAME}`,
            {
              redirectHTTP: true,
              protocol: elbv2.ApplicationProtocol.HTTPS,
              loadBalancer: sharedLoadBalancer,
              vpc: sharedVirtualPrivateCloud,
              taskSubnets: {
                subnets: sharedVirtualPrivateCloud.privateSubnets,
              },
              cpu: fargateServiceConfig.CPU,
              memoryLimitMiB: fargateServiceConfig.MEMORY_LIMIT,
              certificate: sharedPublicCertificate,
              taskImageOptions: {
                image: ecs.ContainerImage.fromEcrRepository(
                  ecr.Repository.fromRepositoryArn(
                    this,
                    `${this.node.tryGetContext(
                      "NAME_PREFIX"
                    )}MicroservicesECRRepo-${
                      fargateServiceConfig.SERVICE_NAME
                    }`,
                    this.node.tryGetContext("ECR_REPOSITORY_ARN")
                  ),
                  fargateServiceConfig.IMAGE_TAG
                ),
                containerPort: fargateServiceConfig.CONTAINER_PORT,
                enableLogging: true,
              },
              desiredCount: fargateServiceConfig.DESIRED_FARGATE_TASK_COUNT,
            }
          );

        loadBalancedFargateService.targetGroup.configureHealthCheck({
          healthyHttpCodes: fargateServiceConfig.HEALTH_CHECK_HTTP_CODES,
          path: fargateServiceConfig.HEALTH_CHECK_PATH,
          port: fargateServiceConfig.CONTAINER_PORT.toString(),
        });

        loadBalancedFargateService.service
          .autoScaleTaskCount({
            minCapacity: fargateServiceConfig.MINIMUM_FARGATE_TASK_COUNT,
            maxCapacity: fargateServiceConfig.MAXIMUM_FARGATE_TASK_COUNT,
          })
          .scaleOnCpuUtilization(
            `${fargateServiceConfig.SERVICE_NAME}CpuScaling`,
            {
              targetUtilizationPercent:
                fargateServiceConfig.TARGET_CPU_UTILIZATION_PERCENT,
            }
          );

        sharedLoadBalancer.listeners[0].addTargetGroups(
          `${fargateServiceConfig.SERVICE_NAME}TargetGroup`,
          {
            targetGroups: [loadBalancedFargateService.targetGroup],
            conditions: [
              elbv2.ListenerCondition.pathPatterns(
                fargateServiceConfig.PATH_PATTERNS
              ),
            ],
            priority: fargateServiceConfig.REQUEST_PRIORITY,
          }
        );

        // TODO: deploy the microservices in a shared load balancer and set up connection for ecs tasks to mq and rds staging resources

        /*  sharedDatabase.connections.allowFrom(
          loadBalancedFargateService.service,
          ec2.Port.tcp(5432),
          `Allow connections from the ${fargateServiceConfig.SERVICE_NAME} Fargate service to the RDS PostgreSQL`
        ); */

        /*  sharedRabbitMQMessageBroker.connections?.allowFrom(
          loadBalancedFargateService.service,
          ec2.Port.allTcp(),
          `Allow connections from the ${fargateServiceConfig.SERVICE_NAME} Fargate service to the RabbitMQ broker`
        ); */
      }
    );
  }
}
