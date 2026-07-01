import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const register = useRegister();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    register.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          // Auth wrapper will handle redirect to /onboarding
        },
        onError: (err) => {
          toast({
            title: "Initialization Failed",
            description: err.message || "An error occurred during profile creation.",
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md glass-card p-8 rounded-3xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-medium text-primary uppercase tracking-widest">Protocol Start</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Create Profile</h1>
          <p className="text-muted-foreground text-sm">Step 1 of your transformation.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70 ml-1">Preferred Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary" {...field} />
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70 ml-1">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="architect@xbrain.pro" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary" {...field} />
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
                  <FormLabel className="text-white/70 ml-1">Secure Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-12 bg-black/50 border-white/10 text-white rounded-xl focus-visible:ring-primary focus-visible:border-primary" {...field} />
                  </FormControl>
                  <FormMessage className="ml-1" />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full h-12 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-glow transition-all"
              disabled={register.isPending}
            >
              {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Framework"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="text-white hover:text-primary transition-colors font-medium">
              Access System
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
