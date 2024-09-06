# LaunchDarkly Convex Component

This is a Convex component for LaunchDarkly. It syncs your LaunchDarkly environment with Convex, allowing you to use evalute feature flags in queries and mutations.

It also implements LDClient for the Convex runtime, allowing you to use the LaunchDarkly SDK in your Convex code.

## Usage

This project includes a demo that shows how to use the LaunchDarkly Convex component in a Convex application.

Run these commands in separate terminals:

```bash
npx convex dev
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
