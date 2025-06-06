import { z } from "zod";

const UsernameRegex = /^[a-zA-Z0-9_]{5,}$/;

export const AuthRegisterSchema = z.object({
  username: z
    .string()
    .regex(
      UsernameRegex,
      "Username minimal 5 karakter, hanya boleh huruf, angka, atau underscore."
    ),
  fullname: z.string().min(8, "Nama harus terdiri minimal 8 karakter"),
  email: z.string().email("Format email salah!"),
  password: z
    .string()
    .min(8, "Kata sandi harus terdiri minimal 8 karakter")
    .regex(
      /(?=.*?[A-Z])/,
      "Kata sandi harus mengandung setidaknya satu huruf besar"
    )
    .regex(/(?=.*?[0-9])/, {
      message: "Kata sandi harus mengandung setidaknya satu angka",
    }),
});

export type AuthRegisterTypeSchema = z.infer<typeof AuthRegisterSchema>;

export const AuthLoginSchema = z.object({
  identifier: z.string().superRefine((val, ctx) => {
    // Cek email
    const emailResult = z.string().email().safeParse(val);
    if (emailResult.success) return;

    // Cek username
    if (UsernameRegex.test(val)) return;

    if (val.includes("@")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format email tidak valid",
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Username minimal 5 karakter, hanya boleh huruf, angka, atau underscore.",
      });
    }
  }),
  password: z
    .string()
    .min(8, "Kata sandi harus terdiri minimal 8 karakter")
    .regex(
      /(?=.*?[A-Z])/,
      "Kata sandi harus mengandung setidaknya satu huruf besar"
    )
    .regex(/(?=.*?[0-9])/, {
      message: "Kata sandi harus mengandung setidaknya satu angka",
    }),
});

export type AuthLoginTypeSchema = z.infer<typeof AuthLoginSchema>;
