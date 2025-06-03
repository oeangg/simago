"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLoginTypeSchema, AuthLoginSchema } from "@/schemas/auth-zodSchema";
import { CardAuthWrapper } from "./auth-wrapper";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const form = useForm<AuthLoginTypeSchema>({
    resolver: zodResolver(AuthLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { control, handleSubmit, reset } = form;
  const router = useRouter();

  const { mutate: authLoginAccount, isPending: isPendingLogin } =
    trpc.Auth.Login.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        reset();
        router.push("/dashboard");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const HandleSubmitLogin = (data: AuthLoginTypeSchema) => {
    authLoginAccount({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <CardAuthWrapper
      titleHeader="Login"
      descHeader="Welcome back, Please Log in to continue"
      descFooter="Don't Have an account?"
      labelFooter="Create an account"
      hrefFooter="/auth/register"
    >
      <Form {...form}>
        <form onSubmit={handleSubmit(HandleSubmitLogin)} className="space-y-4">
          <FormField
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Input your email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            name="email"
            // render=
          />
          <FormField
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Input your password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            name="password"
            // render=
          />

          <Button
            type="submit"
            className="w-full disabled:opacity-30"
            disabled={isPendingLogin}
          >
            {isPendingLogin ? "Login..." : "Login"}
          </Button>
        </form>
      </Form>
    </CardAuthWrapper>
  );
};
