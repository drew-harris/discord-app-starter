import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ReplicacheProvider } from "./context/replicache.tsx";
import { Replicache, WriteTransaction } from "replicache";
import { nanoid } from "nanoid";

const licenseKey = import.meta.env.VITE_REPLICACHE_KEY;
if (!licenseKey) {
  throw new Error("Missing VITE_REPLICACHE_KEY");
}

export const rep = new Replicache({
  name: nanoid(5),
  licenseKey,
  pushURL: "/replicache/push",
  pullURL: "/replicache/pull",
  logLevel: "debug",

  mutators: {
    async setCount(tx: WriteTransaction, newCount: number) {
      await tx.set(`counter`, {
        count: newCount,
      });
    },
  },
});

// Open a websocket connection
const openConnection = async () => {
  console.log("Opening websocket connection");
  const ws = new WebSocket("ws://localhost:5173/ws");
  ws.onopen = () => {
    console.log("Connected to websocket");
  };
  ws.onmessage = (event) => {
    console.log("Received message", event.data);
    const message = JSON.parse(event.data);
    rep.pull(message);
  };
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReplicacheProvider replicache={rep}>
      <App />
    </ReplicacheProvider>
  </React.StrictMode>,
);

await openConnection();
