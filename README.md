# LaunchDarkly Convex Component

This is a Convex component for LaunchDarkly. It syncs your LaunchDarkly environment with Convex, allowing you to use evalute feature flags in queries and mutations.

It also implements LDClient for the Convex runtime, allowing you to use the LaunchDarkly SDK in your Convex code.

## TODO:

- [x] Implement LDClient
- [x] Implement feature store
- [ ] Implement events and telemetry
- [ ] Handle limits on arguments sizes when environment configurations are large
- [ ] Sync with webhooks or streaming instead of polling
- [ ] Handle big segments
- [ ] Handle secure mode
- [ ] Allow deeper configuration of the client
- [ ] Squash bugs as discovered
