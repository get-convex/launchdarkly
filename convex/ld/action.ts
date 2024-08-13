"use node";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import * as ld from "@launchdarkly/node-server-sdk";

export default action(async (ctx) => {
  if (!process.env.LAUNCHDARKLY_SDK_KEY) {
    throw new Error("LAUNCHDARKLY_SDK_KEY is required");
  }

  const client = ld.init(process.env.LAUNCHDARKLY_SDK_KEY, {
    sendEvents: false,
  });
  await client.waitForInitialization({
    timeout: 5,
  });

  // @ts-expect-error - not typed
  const featureStore = client.featureStore as ld.LDFeatureStore;
  const fetchAll = (namespace: string) => {
    return new Promise<ld.LDFeatureStoreKindData>((resolve) => {
      featureStore.all({ namespace }, (data) => {
        resolve(data);
      });
    });
  };

  const features = await fetchAll("features");
  const segments = await fetchAll("segments");
  // TODO: Handle limits on size of args.
  await ctx.runMutation(internal.ld.mutation.default, {
    features,
    segments,
  });
});
