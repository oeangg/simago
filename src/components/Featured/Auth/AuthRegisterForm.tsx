"use client";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { CardAuthWrapper } from "./AuthWrapper";
import {
  authRegisterSchema,
  authRegisterTypeSchema,
} from "@/schemas/authSchema";
import { useForm } from "react-hook-form";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const RegisterForm = () => {
  const form = useForm<authRegisterTypeSchema>({
    resolver: zodResolver(authRegisterSchema),
    defaultValues: {
      username: "",
      email: "",
      fullname: "",
      password: "",
    },
  });

  const { handleSubmit, control, reset } = form;
  const router = useRouter();
  const { mutate: authCreateAccount, isPending: isPendingRegister } =
    trpc.Auth.Register.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        reset();
        router.push("/auth/login");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleRegisterSubmit = (
    data: Omit<authRegisterTypeSchema, "confirmPassword">
  ) => {
    authCreateAccount({
      username: data.username,
      fullname: data.fullname,
      email: data.email,
      password: data.password,
    });
  };

  return (
    <CardAuthWrapper
      titleHeader="Register"
      descHeader="Create Account"
      descFooter="Already Have an account?"
      labelFooter="Login Here"
      hrefFooter="/auth/login"
    >
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleRegisterSubmit)}
          className="space-y-3"
        >
          <FormField
            control={control}
            name="username"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Input your username"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="fullname"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel>Fullname</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Input your fullname"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="Example : email@gmail.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
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
          />
          <Button
            type="submit"
            variant="default"
            className="w-full disabled:opacity-40"
            disabled={isPendingRegister}
          >
            {isPendingRegister ? "Registering.." : "Register"}
          </Button>
        </form>
      </Form>
    </CardAuthWrapper>
  );
};
