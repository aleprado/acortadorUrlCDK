import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpcStack';
import { TableStack } from '../lib/stacks/ddbStack';
import { ServiceStack } from '../lib/stacks/serviceStack';
import { PipelineStack } from '../lib/stacks/pipelineStack';
import { DashboardStack } from '../lib/stacks/dashboardStack';
import { AlarmStack } from '../lib/stacks/alarmStack';
import { EcrStack } from '../lib/stacks/ecrStack';
import { getConfig } from '../lib/config/environment';

const app = new cdk.App();
const envConfig = getConfig();

const vpcStack = new VpcStack(app, 'AcortadorVpcStack', {
  env: { region: getConfig().region }
});

const tableStack = new TableStack(app, 'AcortadorTableStack', {
  env: { region: getConfig().region }
});

const ecrStack = new EcrStack(app, 'AcortadorEcrStack', {
  env: { region: 'us-east-1' }
});

const serviceStack = new ServiceStack(app, 'AcortadorServiceStack', {
  env: { region: getConfig().region },
  vpc: vpcStack.vpc,
  table: tableStack.table,
  ecrRepositoryName: ecrStack.repository.repositoryName,
  ecrRepositoryArn: ecrStack.repository.repositoryArn,
  envConfig
});

const pipelineStack = new PipelineStack(app, 'AcortadorPipelineStack', {
  ecrRepositoryName: ecrStack.repository.repositoryName,
  ecsClusterName: serviceStack.ecsCluster.clusterName,
  ecsServiceName: serviceStack.ecsService.serviceName,
  ecsClusterVpc: vpcStack.vpc,
});


const dashboardStack = new DashboardStack(app, 'AcortadorDashboardStack', {
  env: { region: getConfig().region  }
});


const alarmStack = new AlarmStack(app, 'AcortadorAlarmStack', {
  env: { region: getConfig().region  }
});


serviceStack.addDependency(vpcStack);
serviceStack.addDependency(tableStack);
serviceStack.addDependency(ecrStack);
pipelineStack.addDependency(serviceStack);
dashboardStack.addDependency(serviceStack);
alarmStack.addDependency(serviceStack);