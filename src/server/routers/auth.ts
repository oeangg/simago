import { AuthLoginSchema, AuthRegisterSchema } from "@/schemas/auth-schema";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { Payload } from "@/types/payload";

export const authRouter = router({
  Register: publicProcedure
    .input(AuthRegisterSchema)
    .mutation(async ({ input, ctx }) => {
      // cek apakah ada email sama

      const { db } = ctx;

      const userIsExist = await db.user.findFirst({
        where: {
          OR: [
            {
              username: input.username,
            },
            {
              email: input.username,
            },
          ],
        },
      });

      if (userIsExist) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username/Email sudah ada, isikan yang lain!",
        });
      }

      //hash password
      const hashPassword = await bcrypt.hash(input.password, 12);

      try {
        await db.user.create({
          data: {
            username: input.username,
            email: input.email,
            password: hashPassword,
            fullname: input.fullname,
          },
        });
        return { message: "Register user berhasil, silahkan login!" };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal register data",
        });
      }
    }),

  Login: publicProcedure
    .input(AuthLoginSchema)
    .mutation(async ({ ctx, input }) => {
      const JWTSECRET = new TextEncoder().encode(process.env.JWT_SECRET);

      const { db } = ctx;

      //cek email ada dan user active
      const findUser = await db.user.findFirst({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                {
                  username: input.identifier,
                },
                {
                  email: input.identifier,
                },
              ],
            },
          ],
        },
      });

      if (!findUser) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Credential",
        });
      }

      const isPasswordMatch = await bcrypt.compare(
        input.password,
        findUser.password
      );

      if (!isPasswordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Credential",
        });
      }

      //cek session jika active delete
      const isSessionActive = await db.session.findUnique({
        where: {
          userId: findUser.id,
        },
      });

      if (isSessionActive) {
        await db.session.delete({
          where: {
            userId: isSessionActive.userId,
          },
        });
      }

      // create session jika tidak ada sessiin aktif
      const createSession = await db.session.create({
        data: {
          userId: findUser.id,
        },
      });

      // return { message: `${createSession.userId}, Selamat datang kembali!` };

      const payload: Payload = {
        sessionId: createSession.id,
        role: findUser.role,
        userId: findUser.id,
      };

      // // create jwt token u cookie
      const token = await new SignJWT(payload)
        .setProtectedHeader({
          alg: "HS256",
        })
        .setExpirationTime("1d")
        .sign(JWTSECRET);

      const cookieStore = await cookies();
      cookieStore.set({
        name: "__AingMaung",
        value: token,
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24, //1day
        sameSite: "lax",
      });

      console.log(token);

      return { message: `${findUser.fullname}, Selamat datang kembali!` };
    }),

  Logout: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      try {
        await db.session.delete({
          where: {
            id: input.sessionId,
          },
        });

        (await cookies()).delete("__AingMaung");

        return { message: `Logout Berhasil!` };
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Logout tidak berhasil",
        });
      }
    }),
});
