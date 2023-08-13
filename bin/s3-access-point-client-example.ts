#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Ec2TesterStack } from "../lib/ec2-tester-stack";

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};

new Ec2TesterStack(app, "Ec2TesterStack", {
  env: env
});
