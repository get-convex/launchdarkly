import convexLogo from "./assets/convex.svg";
import launchdarklyLogo from "./assets/launchdarkly.svg";
import "./App.css";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";

function App() {
  const flagValues = useAction(api.fn.listFlags);
  const [f, setF] = useState();
  useEffect(() => {
    const x = async () => {
      const result = await flagValues();
      setF(result);
    };
    x();
  }, []);

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
      <div className="card">
        Flag values for test user:
        <pre>
          <code>{JSON.stringify(f, undefined, 2)}</code>
        </pre>
      </div>
    </>
  );
}

export default App;
