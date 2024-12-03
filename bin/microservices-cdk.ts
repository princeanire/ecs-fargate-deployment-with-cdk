#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MicroservicesCdkStack } from "../lib/microservices-cdk-stack";

const app = new cdk.App();

const env = {
  region: app.node.tryGetContext("AWS_REGION"),
  account: app.node.tryGetContext("AWS_ACCOUNT_ID"),
};

new MicroservicesCdkStack(app, "MicroservicesCdkStack", {
  env: env,
  analyticsReporting: false,
  synthesizer: new cdk.BootstraplessSynthesizer(),
  terminationProtection: app.node.tryGetContext("DELETION_PROTECTION"),
});
