import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const login = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    login.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          // Auth wrapper will handle redirect
        },
        onError: (err) => {
          toast({
            title: "Authentication Failed",
            description: err.message || "Please check your credentials and try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-card p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center text-white font-bold font-heading text-xl shadow-glow">
            X
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Admin Access</h1>
          <p className="text-muted-foreground text-sm">Log in to manage Neura City.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70 ml-1">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="admin@xbrainpro.com" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary" {...field} />
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70 ml-1">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary" {...field} />
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-12 mt-6 rounded-xl bg-white text-black hover:bg-white/90 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access System"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:text-white transition-colors font-medium">
              Back to Neura City
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
