import { db } from "@/lib/prisma";
import { getSession } from "./getSession";
import { Payload } from "@/types/payload";

export type Context = {
  session: Payload | null;
  db: typeof db;
};

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const session = await getSession(req);

  return {
    session,
    db,
  };
}
