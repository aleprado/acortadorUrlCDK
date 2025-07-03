import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { EnvironmentConfig } from '../config/environment';

interface ServiceStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  table: dynamodb.ITable;
  envConfig: EnvironmentConfig;
  ecrRepositoryArn: string;
  ecrRepositoryName: string;
}

export class ServiceStack extends cdk.Stack {
  public readonly ecsCluster: ecs.ICluster;
  public readonly ecsService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, 'AcortadorCluster', {
      vpc: props.vpc,
      clusterName: 'AcortadorCluster',
      containerInsights: true
    });
    this.ecsCluster = cluster;

    const logGroup = new logs.LogGroup(this, 'AcortadorLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const repository = ecr.Repository.fromRepositoryAttributes(this, 'AcortadorEcrRepo', {
      repositoryArn: props.ecrRepositoryArn,
      repositoryName: props.ecrRepositoryName,
    });

    const containerImage = ecs.ContainerImage.fromEcrRepository(repository);

    const container = taskDef.addContainer('AcortadorContainer', {
      image: containerImage,
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: 'Acortador'
      })
    });

    container.addPortMappings({ containerPort: 80 });

    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'AcortadorService', {
      cluster,
      taskDefinition: taskDef,
      publicLoadBalancer: true,
      assignPublicIp: true,
      desiredCount: 1,
      listenerPort: 80,
      loadBalancerName: 'AcortadorLB',
      memoryLimitMiB: 512,
      cpu: 256,
      taskSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      serviceName: 'AcortadorService',
    });
    this.ecsService = service.service;

    const resolveUrlandPath = 'http://' + service.loadBalancer.loadBalancerDnsName + props.envConfig.resolvePath

    container.addEnvironment('BASE_URL', resolveUrlandPath);
    container.addEnvironment('ENV', props.envConfig.environmentName);
    container.addEnvironment('LOG_LEVEL', props.envConfig.logLevel);
    container.addEnvironment('TTL_DAYS', props.envConfig.ttlDays.toString());
    container.addEnvironment('DDB_TABLE', props.table.tableName);
    container.addEnvironment('PORT', props.envConfig.port);

    props.table.grantReadWriteData(taskDef.taskRole);

    const scaling = service.service.autoScaleTaskCount({ maxCapacity: 4 });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    service.targetGroup.configureHealthCheck({
      path: '/ping',
    });

  }
}