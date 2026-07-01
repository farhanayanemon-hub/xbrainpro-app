import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUpdateProfile, getGetCurrentUserQueryKey, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowRight, Loader2, Target } from "lucide-react";

const onboardingSchema = z.object({
  about: z.string().min(5, "Tell us a bit more about yourself"),
  currentSituation: z.string().min(5, "Describe your current situation"),
  biggestChallenge: z.string().min(5, "What is your biggest obstacle?"),
  motivation: z.string().min(5, "Why now?"),
  focusMinutesPerDay: z.number().min(5).max(180),
});

const STEPS = [
  { id: "about", title: "Identity", question: "Who are you right now?", desc: "Define your current state." },
  { id: "currentSituation", title: "Reality", question: "What is your daily reality?", desc: "Where are you spending your energy?" },
  { id: "biggestChallenge", title: "Friction", question: "What holds you back?", desc: "Identify the primary constraint." },
  { id: "motivation", title: "Drive", question: "Why change now?", desc: "What triggered this moment?" },
  { id: "focusMinutesPerDay", title: "Commitment", question: "Daily time commitment?", desc: "How many minutes will you dedicate to the protocol?" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  const form = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      about: "",
      currentSituation: "",
      biggestChallenge: "",
      motivation: "",
      focusMinutesPerDay: 30,
    },
    mode: "onChange",
  });

  const nextStep = async () => {
    const fields = [
      "about",
      "currentSituation",
      "biggestChallenge",
      "motivation",
      "focusMinutesPerDay",
    ] as const;

    const currentField = fields[step];
    const isValid = await form.trigger(currentField);

    if (isValid) {
      if (step === STEPS.length - 1) {
        submitData(form.getValues());
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const submitData = (data: z.infer<typeof onboardingSchema>) => {
    updateProfile.mutate(
      { data: { ...data, onboarded: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          setLocation("/paths");
        },
      }
    );
  };

  const currentStepData = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="mb-12 flex items-center justify-between">
          <div className="text-white/50 font-mono text-sm tracking-widest">
            PHASE 0{step + 1} // 0{STEPS.length}
          </div>
          <Target className="text-primary w-6 h-6 opacity-50" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              {currentStepData.question}
            </h1>
            <p className="text-xl text-muted-foreground mb-12">
              {currentStepData.desc}
            </p>

            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                {step === 0 && (
                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="I am..."
                            className="min-h-[150px] text-lg lg:text-xl bg-white/5 border-white/10 rounded-2xl p-6 focus-visible:ring-primary resize-none placeholder:text-white/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {step === 1 && (
                  <FormField
                    control={form.control}
                    name="currentSituation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="My days consist of..."
                            className="min-h-[150px] text-lg lg:text-xl bg-white/5 border-white/10 rounded-2xl p-6 focus-visible:ring-primary resize-none placeholder:text-white/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {step === 2 && (
                  <FormField
                    control={form.control}
                    name="biggestChallenge"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="I constantly struggle with..."
                            className="min-h-[150px] text-lg lg:text-xl bg-white/5 border-white/10 rounded-2xl p-6 focus-visible:ring-primary resize-none placeholder:text-white/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {step === 3 && (
                  <FormField
                    control={form.control}
                    name="motivation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="I decided to change because..."
                            className="min-h-[150px] text-lg lg:text-xl bg-white/5 border-white/10 rounded-2xl p-6 focus-visible:ring-primary resize-none placeholder:text-white/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {step === 4 && (
                  <FormField
                    control={form.control}
                    name="focusMinutesPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-3xl">
                          <div className="text-7xl font-heading font-bold text-white mb-2 tracking-tighter">
                            {field.value}<span className="text-2xl text-muted-foreground ml-2">min</span>
                          </div>
                          <p className="text-muted-foreground mb-8">per day</p>
                          <FormControl>
                            <Slider
                              min={5}
                              max={180}
                              step={5}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                              className="w-full max-w-sm"
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="flex justify-end pt-8 border-t border-white/5">
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={updateProfile.isPending}
                    className="h-14 px-8 rounded-full bg-white text-black hover:bg-white/90 text-lg font-medium transition-all group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        {step === STEPS.length - 1 ? "Complete Scan" : "Next Parameter"}
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
