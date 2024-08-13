import type {
  LDContext,
  LDMigrationOpEvent,
  Platform,
} from "@launchdarkly/node-server-sdk";
import { FunctionReference } from "convex/server";
import {
  LDClientImpl,
  LDClient as LDClientType,
} from "@launchdarkly/js-server-sdk-common";
import { featureStore } from "./featureStore";
import { GenericCtx } from "../../convex/_generated/server";

/**
 * The LaunchDarkly Convex SDK client object.
 */
export class LDClient extends LDClientImpl {
  constructor(
    ctx: GenericCtx,
    launchdarklyComponent: {
      store: {
        get: FunctionReference<"query", "internal">;
        all: FunctionReference<"query", "internal">;
      };
    }
  ) {
    super(
      // SDK key is not used in the Convex SDK because we're pulling flags from the database.
      "_",
      // Platform is not used in the Convex SDK because we're not sending events.
      {} as Platform,
      {
        // Override the feature store to use the Convex database.
        featureStore: featureStore(ctx, launchdarklyComponent),

        // Don't send any events to LaunchDarkly (TODO: Implement by processing the events in Convex instead).
        sendEvents: false,
        diagnosticOptOut: false,

        // Override the update processor to do nothing. We never want to process updates.
        updateProcessor: { start: () => {}, stop: () => {}, close: () => {} },

        logger: console,

        wrapperName: "convex",
        wrapperVersion: "0.0.1",
      },
      {
        onError: function (err): void {
          console.error(err);
        },
        onFailed: function (err): void {
          console.error(err);
        },
        onReady: function (): void {
          console.debug("LaunchDarkly client ready");
        },
        onUpdate: function (): void {
          throw new Error("Unexpected LaunchDarkly onUpdate call");
        },
        hasEventListeners: function (): boolean {
          return false;
        },
      },
      {}
    );
  }

  override waitForInitialization(): Promise<LDClientType> {
    // we need to resolve the promise immediately because Convex's runtime doesnt
    // have a setimeout so everything executes synchronously.
    return Promise.resolve(this);
  }

  override initialized(): boolean {
    return true;
  }

  override isOffline(): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override secureModeHash(_context: LDContext): string {
    // TODO: Implement secure mode.
    throw new Error("secureModeHash is not yet implemented.");
  }

  override close(): void {
    console.debug("LaunchDarkly: You do not need to call close() in Convex.");
  }

  override track(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _key: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: LDContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    _data?: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metricValue?: number
  ): void {
    throw new Error("track is not yet implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override trackMigration(_event: LDMigrationOpEvent): void {
    throw new Error("trackMigration is not yet implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override identify(_context: LDContext): void {
    throw new Error("identify is not yet implemented.");
  }

  override flush(): Promise<void> {
    throw new Error("flush is not yet implemented.");
  }
}
