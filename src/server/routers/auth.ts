import { AuthLoginSchema } from "@/schemas/auth-zodSchema";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export const authRouter = router({
  Register: publicProcedure
    .input(
      z.object({
        fullname: z.string().min(5),
        email: z.string().email(),
        password: z
          .string()
          .min(8)
          .regex(/(?=.*?[A-Z])/)
          .regex(/(?=.*?[0-9])/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // cek apakah ada email sama

      const { db } = ctx;
      const findEmail = await db.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (findEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email sudah ada, isikan yang lain!",
        });
      }

      //hash password
      const hashPassword = await bcrypt.hash(input.password, 12);

      try {
        await db.user.create({
          data: {
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
          AND: {
            email: input.email,
            isActive: true,
          },
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

      //cek session
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
      const session = await db.session.create({
        data: {
          userId: findUser.id,
        },
      });

      const payload = {
        sessionId: session.id,
        role: findUser.role,
        userId: findUser.id,
      };

      // create jwt token u cookie
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
