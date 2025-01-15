import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/providers/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const user = userCredential?.user;
      console.log("Successfully registered:", user);
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Enter your email below to register an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" required {...field} />
                    </FormControl>
                    <FormDescription>Your email address</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        to="#"
                        className="ml-auto inline-block text-sm underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" required {...field} />
                    </FormControl>
                    <FormDescription>Your password</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Sign up
              </Button>
              <Button
                variant="outline"
                className="w-full"
                type="button"
                onClick={signInWithGoogle}
              >
                Sign up with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="underline">
                Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
export default RegisterForm;
