# Convex Component: LaunchDarkly

[![npm version](https://badge.fury.io/js/@convex-dev%2Flaunchdarkly.svg)](https://badge.fury.io/js/@convex-dev%2Flaunchdarkly)

**Note: Convex Components are currently in beta**

<!-- START: Include on https://convex.dev/components -->

This is a Convex component for feature flagging and experimentation using [LaunchDarkly](https://launchdarkly.com).

It syncs your LaunchDarkly environment to your Convex deployment, allowing you to use your feature flags in Convex.

## Why use LaunchDarkly with Convex?

- **Feature flags in your backend**: Use feature flags in your Convex functions to dynamically control the behavior of your app.
- **Experimentation**: Run A/B tests and feature experiments in Convex using LaunchDarkly.
- **Real-time updates**: Your LaunchDarkly flags and segments are synced to Convex in real-time, so you can use them in your app without needing to make additional API requests.

## Prerequisites

### LaunchDarkly account

To use the LaunchDarkly Convex component, you'll need a LaunchDarkly account. Your LaunchDarkly subscription must include access to integrations.

### Convex App

You'll need an existing Convex project to use the component.
Convex is a hosted backend platform, including a database, serverless functions,
and a ton more you can learn about [here](https://docs.convex.dev/get-started).

Run `npm create convex` or follow any of the [quickstarts](https://docs.convex.dev/home) to set one up.

## Installation

### Install and configure the component package

```bash
npm install @convex-dev/launchdarkly
```

Create a `convex.config.ts` file in your app's `convex/` folder and install the component by calling `use`:

```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly);

export default app;
```

Once you've installed the component, make sure you push your changes to your Convex app:

```bash
npx convex dev
```

Register webhooks by creating an `http.ts` file in your `convex/` folder:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";

const http = httpRouter();

// You may pass a third parameter here to override the default path of `/ld/webhook`
registerRoutes(components.launchdarkly, http);

export default http;
```

This will register two webhook HTTP handlers in your your Convex app's deployment:

- `GET YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will use this endpoint to verify the installation of your component.
- `PUT YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will send your flag and segment data to this endpoint.

### Configure the LaunchDarkly integration

Copy your LaunchDarkly environment's SDK Key and store it as an environment variable named `LAUNCHDARKLY_SDK_KEY` in your Convex deployment. You can do so on the [environment variables](https://dashboard.convex.dev/deployment/settings/environment-variables) page or via `npx convex env set LAUNCHDARKLY_SDK_KEY sdk-***` from the CLI.

You can now configure the LaunchDarkly integration. On the [Integrations page](https://app.launchdarkly.com/settings/integrations) of the LaunchDarkly dashboard, search for Convex and click "Add Integration".

Each of your Convex deployments (e.g. Production and other developer's environments) will need their own integration configured in LaunchDarkly.

![Add Integration](./images/launchdarkly-integration-configuration.png)

Select a name and environment for the integration.

For "Webhook URL", use your deployment's HTTP Actions URL suffixed with the path provided to the `registerRoutes` call in your `http.ts` file. By default, the path is `/ld/webhook`. You can retrieve your HTTP Actions URL on the [Deployment Settings page](https://dashboard.convex.dev/deployment/settings) of the Convex dashboard. Example: `https://techno-kitten-138.convex.site/ld/webhook`

For "Component API Token", generate a shared secret to be used by the LaunchDarkly integration. This will ensure the payloads sent to your webhook are coming from LaunchDarkly.

```bash
npx convex run --component=launchdarkly tokens:generate --push
```

Once you save, you can open the integration form again and click the Validate button to test the connection. If you encounter errors, check the logs page in the Convex dashboard for more information.

Now, you'll need to copy your LaunchDarkly environment's SDK Key and store it in the component. You can copy your LaunchDarkly SDK by loading the [LaunchDarkly dashboard](https://app.launchdarkly.com), selecting your environment, and pressing Cmd + K (or Ctrl + K) to open the command palette. Select the "Copy SDK Key for the current environment" option.

![Copy SDK Key](./images/copy-sdk-key.png)

The value you copied should start with `sdk-`.

You can store the SDK key in your Convex deployment using the following command:

```bash
npx convex run --component=launchdarkly --push sdkKey:store '{ "sdkKey": "<key>" }'
```

### Using the LaunchDarkly component

You may initialize the LaunchDarkly class with the component configuration and use the LaunchDarkly SDK as you would in a normal JavaScript application.

```typescript
import { LaunchDarkly } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";
import { query } from "./_generated/server";

export const myQuery = query({
  args: {},
  handler: async ({ ctx }) => {
    const launchdarkly = new LaunchDarkly(components.launchdarkly, ctx);
    const isFlagOn = await launchdarkly.boolVariation(
      "my-flag",
      { key: "myUser" },
      false
    );
    if (isFlagOn) {
      // Do something when flag is on
    } else {
      // Do something when flag is off
    }
  },
});
```

## Example App

You can run the example in the [`examples`](./example/README.md) folder to see how the LaunchDarkly component works.

## Production

When you're ready to deploy your app to production with LaunchDarkly, be sure to follow all the setup steps for produciton, including adding the `LAUNCHDARKLY_SDK_KEY` evnironment variable and configuring an additional shared secret and integration for Production. You'll want this to be configured before any of your code relies on the LaunchDarkly flags.

You may use this command to generate your production secret:

```bash
npx convex run --component=launchdarkly --prod tokens:generate
```

## Syncing multiple LaunchDarkly environments in one Convex app

If you have multiple LaunchDarkly environments, you can create a separate component configuration for each environment.

```typescript
// convex/convex.config.js
import { defineApp } from "convex/server";
import launchdarkly from "@convex-dev/launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly, {
  name: "first",
});

app.use(launchdarkly, {
  name: "second",
});

export default app;
```

Be sure to also update your `http.ts` file to register the routes for each component:

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@convex-dev/launchdarkly";
import { components } from "./_generated/api";

const http = httpRouter();

registerRoutes(components.first, http, "/ld/first");
registerRoutes(components.second, http, "/ld/second");

export default http;
```

Then you can generate a separate shared secret for each environment:

```bash
npx convex run --component=first tokens:generate
npx convex run --component=second tokens:generate
```

Also, store the appropriate SDK keys in your Convex deployment for each LaunchDarkly environment:

```bash
npx convex run --component=first sdkKey:store '{ "sdkKey": "<first_key>" }'
npx convex run --component=second sdkKey:store '{ "sdkKey": "<second_key>" }'
```

These secrets can be plugged into seperate integration configurations in LaunchDarkly.

once configured, you may initialize `LaunchDarkly` with the appropriate component configuration:

```typescript
import { LaunchDarkly } from "@convex-dev/launchdarkly";

export const myQuery = query({
  args: {},
  handler: async ({ ctx }) => {
    const launchdarklyFirst = new LaunchDarkly(components.first, ctx);

    const launchdarklySecond = new LaunchDarkly(components.second, ctx);

    ...
  },
});
```

## Unsupported LaunchDarkly features

The LaunchDarkly component for Convex is in beta, and may not support all functionality available in the LaunchDarkly SDK.
If you encounter any issues or need help with a specific feature, please file an issue in the [GitHub repository](https://github.com/get-convex/launchdarkly/issues).

- Sending events in Convex queries is not supported. If you would like to have the SDK send events to LaunchDarkly (e.g. flag evaluation insights and for experimentation), you should use LaunchDarkly in a mutation or action instead.
- Big segments
- Diagnostic events

<!-- END: Include on https://convex.dev/components -->
