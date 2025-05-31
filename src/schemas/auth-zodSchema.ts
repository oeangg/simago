import { z } from "zod";

export const AuthRegisterSchema = z
  .object({
    fullname: z.string().min(5, "Nama harus terdiri minimal 8 karakter"),
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
    confirmPassword: z
      .string()
      .min(8, "Kata sandi harus terdiri minimal 8 karakter")
      .regex(
        /(?=.*?[A-Z])/,
        "Kata sandi harus mengandung setidaknya satu huruf besar"
      )
      .regex(/(?=.*?[0-9])/, {
        message: "Kata sandi harus mengandung setidaknya satu angka",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi tidak sama!",
    path: ["confirmPassword"],
  });

export type AuthRegisterTypeSchema = z.infer<typeof AuthRegisterSchema>;

export const AuthLoginSchema = z.object({
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

export type AuthLoginTypeSchema = z.infer<typeof AuthLoginSchema>;
