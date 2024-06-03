import { useContext, useState } from "react";
import { useSubscribe } from "replicache-react";
import { replicacheContext } from "./context/replicache";
import { useEffect } from "hono/jsx";

function App() {
  const rep = useContext(replicacheContext);
  const count = useSubscribe(rep, async (tx) => {
    const count = await tx.get<{ count: number }>("counter");
    return count?.count;
  });
  const setCount = async () => {
    await rep?.mutate.setCount((count || 0) + 1);
  };

  useEffect(() => {
    console.log("replicacheIs", rep);
  });

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onMouseDown={() => setCount()}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
