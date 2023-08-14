import { StackProps, Stack } from "aws-cdk-lib";
import {
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetFilter
} from "aws-cdk-lib/aws-ec2";
import * as kms from "aws-cdk-lib/aws-kms";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyStatement,
  Effect
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { LookupUtils } from "./lookup-utils";

export class Ec2TesterStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = LookupUtils.vpcLookup(this, "VpcLookup");

    const role = new Role(this, "InstanceRoleWithSsmPolicy", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com")
    });
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("PowerUserAccess"));

    /**
     * Permit use of the CMK used to encrypt the source S3 bucket
     */
    role.addToPolicy(
      new PolicyStatement({
        actions: [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ],
        resources: ["arn:aws:kms:us-east-1:226350727888:key/186deba8-d4b0-4f4c-aba3-f0dfeedea978"],
        effect: Effect.ALLOW
      })
    );
    /**
     * Allow s3:GetObject actions to the bucket via the access point
     */
    role.addToPolicy(
      new PolicyStatement({
        actions: ["s3:GetObject*"],
        resources: ["arn:aws:s3:us-east-1:226350727888:accesspoint/access-point-799104667460/*"],
        effect: Effect.ALLOW
      })
    );
    /**
     * Allow s3:ListBucket actions to the bucket via the access point
     */
    role.addToPolicy(
      new PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: ["arn:aws:s3:us-east-1:226350727888:accesspoint/access-point-799104667460"],
        effect: Effect.ALLOW
      })
    );
    const sg = new SecurityGroup(this, "InstanceSecurityGroup", {
      vpc: vpc,
      allowAllOutbound: false,
      disableInlineRules: true
    });

    sg.addIngressRule(
      Peer.ipv4("100.64.32.0/19"),
      Port.tcp(22),
      "Allow all traffic within the security group"
    );
    sg.addEgressRule(
      Peer.ipv4("100.64.32.0/19"),
      Port.allTcp(),
      "Allow all traffic within the security group"
    );
    sg.addEgressRule(
      Peer.ipv4("10.105.120.0/21"),
      Port.allTcp(),
      "Allow all traffic within the security group"
    );
    sg.addIngressRule(
      Peer.ipv4("10.105.120.0/21"),
      Port.tcp(22),
      "Allow all traffic within the security group"
    );
    const instance = new Instance(this, "TestInstance", {
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetFilters: [SubnetFilter.containsIpAddresses(["100.64.52.100", "100.64.40.100"])]
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      machineImage: MachineImage.latestAmazonLinux2023(),
      role: role,
      securityGroup: sg,
      userDataCausesReplacement: true
    });
    instance.connections.allowTo(
      Peer.prefixList("pl-63a5400a"),
      Port.tcp(443),
      "Allow access to S3"
    );
  }
}
