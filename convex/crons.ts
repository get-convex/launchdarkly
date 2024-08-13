import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();
crons.interval(
  "Update LaunchDarkly",
  { seconds: 5 },
  api.ld.action.default,
  {}
);

export default crons;
