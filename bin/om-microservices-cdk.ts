#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OmMicroservicesCdkStack } from "../lib/om-microservices-cdk-stack";

const app = new cdk.App();

const env = {
  region: app.node.tryGetContext("AWS_REGION"),
  account: app.node.tryGetContext("AWS_ACCOUNT_ID"),
};

new OmMicroservicesCdkStack(app, "OmMicroservicesCdkStack", {
  env: env,
  analyticsReporting: false,
  synthesizer: new cdk.BootstraplessSynthesizer()
});
