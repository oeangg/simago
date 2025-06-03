import { db } from "@/lib/prisma";
import { getSession, TSession } from "./get-session";

export type Context = {
  session: TSession;
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
