import { useGetProfile, useUpdateProfile, useLogout, getGetProfileQueryKey, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Save, LogOut, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  about: z.string().optional(),
  currentSituation: z.string().optional(),
  biggestChallenge: z.string().optional(),
  focusMinutesPerDay: z.number().min(5).max(180),
});

export default function Settings() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      about: "",
      currentSituation: "",
      biggestChallenge: "",
      focusMinutesPerDay: 30,
    }
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        about: profile.about || "",
        currentSituation: profile.currentSituation || "",
        biggestChallenge: profile.biggestChallenge || "",
        focusMinutesPerDay: profile.focusMinutesPerDay || 30,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateProfile.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          toast({ title: "System Updated", description: "Profile parameters successfully saved." });
        }
      }
    );
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        window.location.href = "/login";
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-heading font-bold text-white mb-2">System Config</h1>
        <p className="text-muted-foreground">Adjust your neuro-profile parameters.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 md:p-8 rounded-3xl border border-white/5">
        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
            <User className="w-8 h-8 text-white/50" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Identity Profile</h2>
            <p className="text-sm text-muted-foreground">Used by the architect to personalize protocols.</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Core Identity</FormLabel>
                  <FormControl>
                    <Textarea className="bg-white/5 border-white/10 focus-visible:ring-primary min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currentSituation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/70">Current Reality</FormLabel>
                  <FormControl>
                    <Textarea className="bg-white/5 border-white/10 focus-visible:ring-primary min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="focusMinutesPerDay"
              render={({ field }) => (
                <FormItem className="pt-4">
                  <FormLabel className="text-white/70 flex justify-between">
                    Daily Commitment 
                    <span className="text-primary font-bold">{field.value} min</span>
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={5} max={180} step={5}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-6 flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending} className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 shadow-glow">
                {updateProfile.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Save Parameters
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 md:p-8 rounded-3xl border border-destructive/20 bg-destructive/5">
        <h2 className="text-xl font-bold text-white mb-2 text-destructive">System Access</h2>
        <p className="text-sm text-muted-foreground mb-6">Terminate current session and disconnect from the network.</p>
        <Button onClick={handleLogout} disabled={logout.isPending} variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full h-12 px-8">
          {logout.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogOut className="w-5 h-5 mr-2" />}
          Disconnect
        </Button>
      </motion.div>
    </div>
  );
}
