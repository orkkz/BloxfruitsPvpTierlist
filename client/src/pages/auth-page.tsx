import { useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import BloxfruitLogo from "@assets/blox_piece_logo.png";

type FormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, isLoading, loginMutation } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Redirect if already authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  const onSubmit = async (values: FormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Auth Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to access the Bloxfruits Tier List admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || loginMutation.isPending}
                >
                  {(isLoading || loginMutation.isPending) ? (
                    <>Loading...</>
                  ) : (
                    <>Sign In</>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center flex-col space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Access to this area is restricted to administrators only.
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="md:w-1/2 bg-primary/10 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <img src={BloxfruitLogo} alt="Bloxfruits Logo" className="w-48 mx-auto mb-6" />
          <h1 className="text-3xl font-bold tracking-tight">Bloxfruits PVP Tier List</h1>
          <p className="text-muted-foreground text-lg">
            The most comprehensive player rankings across all combat categories.
            Compare performance metrics and discover the top players in the game.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-background/80 p-4 rounded-lg">
              <h3 className="font-semibold">Multiple Categories</h3>
              <p className="text-sm text-muted-foreground">Rankings for melee, fruit, sword, gun and more</p>
            </div>
            <div className="bg-background/80 p-4 rounded-lg">
              <h3 className="font-semibold">Roblox Integration</h3>
              <p className="text-sm text-muted-foreground">Direct access to player profiles and information</p>
            </div>
            <div className="bg-background/80 p-4 rounded-lg">
              <h3 className="font-semibold">Region Tracking</h3>
              <p className="text-sm text-muted-foreground">Filter players by region and combat stats</p>
            </div>
            <div className="bg-background/80 p-4 rounded-lg">
              <h3 className="font-semibold">Admin Controls</h3>
              <p className="text-sm text-muted-foreground">Manage player tiers and site settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}