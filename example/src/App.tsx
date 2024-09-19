import "./App.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
  const fruits = useQuery(api.examples.listFruits);
  const buyFruit = useMutation(api.examples.buyFruit);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <span>List of fruits:</span>

      {JSON.stringify(fruits, null, 2)}

      <button onClick={() => buyFruit()}>Buy Fruit</button>
    </div>
  );
}

export default App;
