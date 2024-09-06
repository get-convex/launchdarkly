import type {
  Info,
  PlatformData,
  SdkData,
} from "@launchdarkly/node-server-sdk";

class ConvexPlatformInfo implements Info {
  platformData(): PlatformData {
    return {
      name: "Convex",
    };
  }

  sdkData(): SdkData {
    return {
      name: "@launchdarkly/convex-server-sdk",
      version: "__LD_VERSION__",
      userAgentBase: "ConvexEdgeSdk",
    };
  }
}

export const createPlatformInfo = () => new ConvexPlatformInfo();
