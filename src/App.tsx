import convexLogo from "./assets/convex.svg";
import launchdarklyLogo from "./assets/launchdarkly.svg";
import "./App.css";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function App() {
  const [context, setContext] = useState('{ "key": "test-user" }');

  const flagValues = useQuery(api.examples.listFlags, { context });

  return (
    <>
      <div>
        <a href="https://launchdarkly.com" target="_blank">
          <img
            src={launchdarklyLogo}
            className="logo"
            alt="LaunchDarkly logo"
          />
        </a>
        <a href="https://convex.dev" target="_blank">
          <img src={convexLogo} className="logo" alt="React logo" />
        </a>
      </div>
      <h1>Convex + LaunchDarkly</h1>
      <div className="input">
        <label htmlFor="context">LaunchDarkly context</label>
        <input
          type="text"
          id="context"
          placeholder="Enter a LaunchDarkly context value"
          value={context}
          onChange={(e) => setContext(e.target.value)}
        />
      </div>
      Flag values for test user, sent from your Convex backend:
      <div className="card">
        {flagValues?.success ? (
          <pre>
            <code>{JSON.stringify(flagValues.flags, undefined, 2)}</code>
          </pre>
        ) : (
          <div>{flagValues?.error ? flagValues.error : "Loading..."}</div>
        )}
      </div>
    </>
  );
}

export default App;
