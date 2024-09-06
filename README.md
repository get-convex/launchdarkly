# LaunchDarkly Convex Component

This is a Convex component for LaunchDarkly. It syncs your LaunchDarkly environment with Convex, allowing you to use evalute feature flags in queries and mutations.

It also implements LDClient for the Convex runtime, allowing you to use the LaunchDarkly SDK in your Convex code.

## Usage

This project includes a demo that shows how to use the LaunchDarkly Convex component in a Convex application.

Run this commands to start the demo backend (it will push any changes you make as you develop):

```bash
npm install
npx convex dev
```

Next you'll need to create a shared secret for the LaunchDarkly Convex component. You can do this by running the following command:

```bash
npm run generateToken
```

Copy the output of this command into this command to store the shared secret in your Convex component:

```bash
npx convex run --component-path=launchdarkly tokens:store '{"token": "NEW_TOKEN_HERE"}'
```

With all of these running, you can now configure the Convex integration on the integrations page of the LaunchDarkly dashboard.

For "Webhook URL", use your deployment's HTTP Actions URL suffixed with the path provided to the `initializeHttp` call in your `http.ts` file. By default, the path is `/ld/webhook`. You can retrieve your HTTP Actions URL on the [Deployment Settings page](https://dashboard.convex.dev/deployment/settings) of the Convex dashboard. Example: https://cheery-rabbit-392.convex.site/ld/webhook

For "Component API Token", use the shared secret you generated earlier.

Once you save, you can open the integration form again and click the Validate button to test the connection. If you encounter errors, check the logs page in the Convex dashboard for more information.

You're all hooked up! You can run the demo's UI to see your flags evaluated for a user.

```bash
npm run dev
```

## TODO:

- [x] Implement LDClient
- [x] Implement feature store
- [x] Allow deeper configuration of the client (only the `application` option, everything else is hardcoded)
- [x] Sync with webhooks or streaming instead of polling
- [x] Secure mode
- [ ] Handle limits on convex document size
- [ ] Replace Authorization header with X-LD-Signature ([PR here](https://github.com/launchdarkly/integration-framework/pull/80))

## Out of scope for MVP

- Sending events and diagnostic telemetry to LaunchDarkly
- Big segments support
- Performance optimizations (only loading the necessary flags and segments for an evaluation to preserve bandwidth within the Convex runtime).
- Handling payloads greater than the maximum Convex function argument size (8MB). These will be accepted at the HTTP-webhook level, but fail when sent to the Convex component to be written for storage.
