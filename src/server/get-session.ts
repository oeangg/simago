import { Payload } from "@/types/payload";
import { jwtVerify } from "jose";

export async function getSession(req: Request) {
  const JWTSECRET = new TextEncoder().encode(process.env.JWT_SECRET);

  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookieObj = Object.fromEntries(
      cookieHeader.split("; ").map((pair) => pair.split("="))
    );
    const token = cookieObj["__AingMaung"];
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWTSECRET);
    // return payload as { sessionId: string; role: string; userId: string };
    return (payload as Payload) || null;
  } catch {
    return null;
  }
}
