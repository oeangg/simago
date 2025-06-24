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
import { authLoginSchema, authLoginTypeSchema } from "@/schemas/authSchema";
import { CardAuthWrapper } from "./AuthWrapper";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export const LoginForm = () => {
  const form = useForm<authLoginTypeSchema>({
    resolver: zodResolver(authLoginSchema),
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

  const handleSubmitLogin = (data: authLoginTypeSchema) => {
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
        <form onSubmit={handleSubmit(handleSubmitLogin)} className="space-y-4">
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
            className="w-full disabled:opacity-60"
            disabled={isPendingLogin}
          >
            {isPendingLogin ? (
              <div className="flex gap-1.5 justify-center items-center">
                <Loader2 className=" animate-pulse" /> Sedang Login...
              </div>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>
    </CardAuthWrapper>
  );
};
