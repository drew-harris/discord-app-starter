import { Hono } from "hono";
import { getLastMutationIdForUser, pokeClients, tools } from "..";
import { MutationV1, PullResponseOKV1, PushRequestV1 } from "replicache";

const replicacheRoutes = new Hono();

replicacheRoutes.get("/", async (c) => {
  c.text("Hello, Replicache!");
});

replicacheRoutes.post("/pull", async (c) => {
  console.log("COUNT", tools.count);
  return c.json({
    lastMutationIDChanges: tools.lastMutations,
    cookie: tools.globalVersion,
    patch: [
      { op: "clear" },
      {
        op: "put",
        key: "counter",
        value: {
          count: tools.count,
        },
      },
    ],
  } as PullResponseOKV1);
});

replicacheRoutes.post("/push", async (c) => {
  const push: PushRequestV1 = await c.req.json();
  const t0 = Date.now();

  try {
    for (const mutation of push.mutations) {
      const t1 = Date.now();
      await processMutation(mutation, mutation.clientID);
      console.log("Processed mutation in", Date.now() - t1);
    }

    pokeClients();
    return c.json({});

    // send a poke
  } catch (err: any) {
    console.error("Failed to apply mutation:", err);
    c.status(500);
    return c.json({ error: err?.message || "OH NO" });
  }
});

const processMutation = async (mutation: MutationV1, clientId: string) => {
  const nextVersion = tools.globalVersion + 1;
  const lastMutation = getLastMutationIdForUser(clientId);
  const nextMutation = lastMutation + 1;
  console.log("NEXT MUTATION", nextMutation);
  console.log("NEXT VERSION", nextVersion);
  if (mutation.id < nextMutation) {
    console.log(`Mutation ${mutation.id} has already been processed`);
    return;
  }

  if (mutation.id > nextMutation) {
    console.error(`Mutation ${mutation.id} is from the future`);
    throw new Error("Mutation from the future");
  }

  console.log("PROCESSING MUTATION", JSON.stringify(mutation));
  switch (mutation.name) {
    case "setCount":
      const newCount = mutation.args as number;
      tools.count = newCount;
      break;
    default:
      throw new Error(`Unknown mutation: ${mutation.name}`);
  }

  //Set next mutation id
  console.log("SETTING NEXT MUTATION", nextMutation);
  tools.lastMutations[clientId] = nextMutation;
  tools.globalVersion = nextVersion;
};

export { replicacheRoutes };
