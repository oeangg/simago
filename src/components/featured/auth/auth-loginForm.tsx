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
import { AuthLoginTypeSchema, AuthLoginSchema } from "@/schemas/auth-schema";
import { CardAuthWrapper } from "./auth-wrapper";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const form = useForm<AuthLoginTypeSchema>({
    resolver: zodResolver(AuthLoginSchema),
    defaultValues: { identifier: "", password: "" },
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
      identifier: data.identifier,
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
                <FormLabel>Username/Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Input your Username/email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            name="identifier"
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
