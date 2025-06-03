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

import { CardAuthWrapper } from "./auth-wrapper";
import {
  AuthRegisterTypeSchema,
  AuthRegisterSchema,
} from "@/schemas/auth-zodSchema";
import { useForm } from "react-hook-form";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";

export const RegisterForm = () => {
  const form = useForm<AuthRegisterTypeSchema>({
    resolver: zodResolver(AuthRegisterSchema),
    defaultValues: {
      email: "",
      fullname: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit, control, reset } = form;

  const { mutate: authCreateAccount, isPending: isPendingRegister } =
    trpc.Auth.Register.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        reset();
      },

      onError: (error) => {
        toast.error(error.message);
      },
    });

  const HandleRegisterSubmit = (
    data: Omit<AuthRegisterTypeSchema, "confirmPassword">
  ) => {
    authCreateAccount({
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
          onSubmit={handleSubmit(HandleRegisterSubmit)}
          className="space-y-4"
        >
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
                    placeholder="Input your email"
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
          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1">
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Input your confirm password"
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
