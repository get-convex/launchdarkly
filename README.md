# LaunchDarkly Convex Component

This is a Convex component for [LaunchDarkly](https://launchdarkly.com). It syncs your LaunchDarkly environment to your Convex deployment, allowing you to use your feature flags in Convex.

## Prerequisites

### LaunchDarkly account

To use the LaunchDarkly Convex component, you'll need a LaunchDarkly account. Your LaunchDarkly subscription must include access to integrations.

### Convex App

You'll need a Convex App to use the component. Follow any of the [Convex quickstarts](https://docs.convex.dev/home) to set one up.

## Installation

### Install and configure the component package

```bash
npm install @convex-dev/launchdarkly-component
```

Create a `convex.config.ts` file in your app's `convex/` folder and install the component by calling `use`:

```typescript
// convex/convex.config.js
import { defineApp } from "convex/server";
import launchdarkly from "../launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly);

export default app;
```

Register webhooks by creating an `http.ts` file in your `convex/` folder and use the client you've exported above:

```typescript
// http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "../launchdarkly/registerRoutes";
import { components } from "./_generated/server";

const http = httpRouter();

// You may pass a third parameter here to override the default path of `/ld/webhook`
registerRoutes(components.launchdarkly, http);

export default http;
```

This will register two webhook HTTP handlers in your your Convex app's deployment:

- `GET YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will use this endpoint to verify the installation of your component.
- `PUT YOUR_CONVEX_SITE_URL/ld/webhook` - LaunchDarkly will send your flag and segment data to this endpoint.

### Configure the LaunchDarkly integration

Once you've installed the component, make sure you push your changes to your Convex app:

```bash
npx convex dev
```

Generate a shared secret to be used by the LaunchDarkly integration. This will ensure the payloads sent to your webhook are coming from LaunchDarkly.

```bash
npx convex run --component-path=launchdarkly tokens:generate
```

You can now configure the LaunchDarkly integration. On the [Integrations page](https://app.launchdarkly.com/settings/integrations) of the LaunchDarkly dashboard, search for Convex and click "Add Integration".

Each of your Convex deployments (e.g. Production and other developer's environments) will need it's own integration configured in LaunchDarkly.

![Add Integration](./images/launchdarkly-integration-configuration.png)

Select a name and environment for the integration.

For "Webhook URL", use your deployment's HTTP Actions URL suffixed with the path provided to the `registerRoutes` call in your `http.ts` file. By default, the path is `/ld/webhook`. You can retrieve your HTTP Actions URL on the [Deployment Settings page](https://dashboard.convex.dev/deployment/settings) of the Convex dashboard. Example: https://techno-kitten-138.convex.site/ld/webhook

For "Component API Token", use the shared secret you generated earlier.

Once you save, you can open the integration form again and click the Validate button to test the connection. If you encounter errors, check the logs page in the Convex dashboard for more information.

### Using the LaunchDarkly component

TODO

## Example

You can run the example in the `examples` folder to see how the LaunchDarkly component works.

```bash
cd examples
npm install
```

Follow the instructions above for [configuring the LaunchDarkly integration](#configure-the-launchdarkly-integration) and then run the example:

````bash
In seperate terminals:

```bash
npx convex dev
````

```bash
npm run dev
```

## Production

When you're ready to deploy your app to production with LaunchDarkly, be sure to configure an additional shared secret and integration for Production. You'll want this to be configured before any of your code relies on the LaunchDarkly flags.

You may use this command to generate your production secret:

```bash
npx convex run --component-path=launchdarkly --prod tokens:generate
```

## Syncing multiple LaunchDarkly environments in one Convex app

If you have multiple LaunchDarkly environments, you can create a separate component configuration for each environment.

```typescript
// convex/convex.config.js
import { defineApp } from "convex/server";
import launchdarkly from "../../launchdarkly/convex.config";

const app = defineApp();

app.use(launchdarkly, {
  name: "first",
});

app.use(launchdarkly, {
  name: "second",
});

export default app;
```

Then you can generate a separate shared secret for each environment:

```bash
npx convex run --component-path=launchdarkly/first tokens:generate
npx convex run --component-path=launchdarkly/second tokens:generate
```

These secrets can be plugged into seperate integration configurations in LaunchDarkly.

Once configured, you can import the query, mutation, and action functions from either component and use them in your app.

## Unsupported features

- Sending events and diagnostic telemetry to LaunchDarkly
- Experimentation
- Big segments
