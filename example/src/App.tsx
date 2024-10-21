import "./App.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";

function App() {
  const fruits = useQuery(api.fruits.listFruits);
  const buyFruit = useMutation(api.fruits.buyFruit);
  const [selectedFruit, setSelectedFruit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  if (selectedFruit && !fruits?.find((f) => f._id === selectedFruit)) {
    setSelectedFruit(null);
  }

  return (
    <div className="fruitStore">
      <h1>Fruit Store</h1>
      {fruits !== undefined && fruits.length === 0 && (
        <div className="error">No fruit available</div>
      )}
      <div className="fruitList">
        {fruits &&
          fruits.map((fruit) => (
            <Fruit
              key={fruit._id}
              name={fruit.name}
              emoji={fruit.emoji}
              selected={selectedFruit === fruit._id}
              selectFruit={() => setSelectedFruit(fruit._id)}
            />
          ))}
      </div>
      <button
        onClick={async () => {
          try {
            setError(null);
            setResult(null);
            const result = await buyFruit();
            if (result?.error) {
              setError(result.error);
              return;
            }

            setResult(
              `You bought a ${fruits?.find((fruit) => fruit._id === selectedFruit)?.name || "fruit"}!`
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (e: any) {
            setError(e.message);
          }
        }}
        disabled={!selectedFruit}
      >
        Buy Fruit
      </button>
      {error && <div className="error">{error}</div>}
      {result && <div className="result">{result}</div>}
    </div>
  );
}

function Fruit({
  name,
  emoji,
  selected,
  selectFruit,
}: {
  name: string;
  emoji: string;
  selected: boolean;
  selectFruit: () => void;
}) {
  return (
    <button
      className={"fruit" + (selected ? " fruit-selected" : "")}
      onClick={selectFruit}
    >
      {emoji}
      <div
        style={{
          fontSize: "1.5rem",
        }}
      >
        {name}
      </div>
    </button>
  );
}

export default App;
