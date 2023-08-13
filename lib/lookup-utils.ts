import { IVpc, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

/**
 * Utils for finding previously deployed resources
 */
export class LookupUtils {
  public static vpcLookup(scope: Construct, id: string): IVpc {
    return Vpc.fromLookup(scope, id, {
      vpcId: scope.node.tryGetContext("vpcId")
    });
  }
}
