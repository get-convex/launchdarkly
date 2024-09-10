// import { RunMutationCtx } from "../typeHelpers";
// import { LaunchDarklyEventStore } from "./LDClient";

// export class EventProcessor {
//   constructor(
//     private readonly ctx: RunMutationCtx,
//     private readonly eventStore: LaunchDarklyEventStore
//   ) {}

//   sendEvent(inputEvent: object) {
//     void (async () => {
//       await this.ctx.runMutation(this.eventStore.storeEvent, {
//         payload: JSON.stringify(inputEvent),
//       });
//     })();
//   }

//   start() {}

//   flush() {
//     return Promise.resolve();
//   }
//   close() {}
// }
