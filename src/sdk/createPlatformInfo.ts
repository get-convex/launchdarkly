import type {
  Info,
  PlatformData,
  SdkData,
} from "@launchdarkly/js-server-sdk-common";

class ConvexPlatformInfo implements Info {
  platformData(): PlatformData {
    return {
      name: "Convex",
    };
  }

  sdkData(): SdkData {
    return {
      name: "@convex/launchdarkly",
      version: "__LD_VERSION__",
      userAgentBase: "ConvexSdk",
    };
  }
}

export const createPlatformInfo = () => new ConvexPlatformInfo();
