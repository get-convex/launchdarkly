import {
  Info,
  PlatformData,
  SdkData,
} from "@launchdarkly/akamai-edgeworker-sdk-common";

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
