import { createContext } from "react";
import { Replicache } from "replicache";
import { rep } from "../client";

export const replicacheContext = createContext<typeof rep | null>(null);

function ReplicacheProvider({
  children,
  replicache,
}: {
  children: React.ReactNode;
  replicache: typeof rep;
}) {
  return (
    <replicacheContext.Provider value={replicache}>
      {children}
    </replicacheContext.Provider>
  );
}

export { ReplicacheProvider };
