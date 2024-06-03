import { createBunWebSocket, serveStatic } from "hono/bun";
import { Hono } from "hono";
import { nanoid } from "nanoid";
import { WSContext } from "hono/ws";
import { replicacheRoutes } from "./routes/replicacheRoutes";

const app = new Hono();

const wsTools = createBunWebSocket();

export let tools = {
  count: 0,
  globalVersion: 0,
  lastMutations: {} as Record<string, number>,
};

export const getLastMutationIdForUser = (userId: string): number => {
  return tools.lastMutations[userId] || 0;
};

app.get("/", (c) =>
  c.html(
    `
  <html>
      <head>
        ${
          import.meta.env.PROD
            ? "<script type='module' src='/static/client.js'></script><link rel='stylesheet' href='/static/assets/client.css'>"
            : "<script type='module' src='/src/client/client.tsx'></script>"
        }
      </head>
      <body>
<div id="root"></div>
      </body>
    </html>
`,
  ),
);

app.use(
  "/static/*",
  serveStatic({
    root: "./dist",
  }),
);

app.route("/replicache", replicacheRoutes);

let socketConnections: Record<string, WSContext> = {};

export const pokeClients = () => {
  for (const key in socketConnections) {
    console.log("Poking client", key);
    socketConnections[key].send(JSON.stringify({ type: "poke" }));
  }
};

app.get(
  "/ws",
  wsTools.upgradeWebSocket((c) => {
    const requestId = nanoid();
    return {
      onOpen(evt, ws) {
        console.log("Opening connection");
        socketConnections[requestId] = ws;
        // Send the client the current count
        ws.send(JSON.stringify({ type: "count", count: tools.count }));
      },

      onMessage(evt, ws) {
        const data = JSON.parse(evt.data.toString());
        console.log("DATA: ", data);
      },

      onClose(evt, ws) {
        console.log("Closing connection");
        delete socketConnections[requestId];
      },
    };
  }),
);

app.get("/test", (c) => c.json({ test: "test" }));

if (import.meta.env.PROD) {
  const port = Number(process.env["PORT"] || 5173);
  Bun.serve({
    port: 5173,
    fetch: app.fetch,
    websocket: wsTools.websocket,
  });
}

export default app;
