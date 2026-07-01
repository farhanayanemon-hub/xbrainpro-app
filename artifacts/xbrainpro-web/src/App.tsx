import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Components
import AppLayout from "@/components/layout/app-layout";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Onboarding from "@/pages/onboarding";
import Paths from "@/pages/paths";
import Start from "@/pages/start";
import Dashboard from "@/pages/dashboard";
import Program from "@/pages/program";
import Progress from "@/pages/progress";
import Coach from "@/pages/coach";
import Reminders from "@/pages/reminders";
import Settings from "@/pages/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useGetCurrentUser();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    
    const publicRoutes = ["/", "/login", "/register"];
    const isPublicRoute = publicRoutes.includes(location);

    if (!user && !isPublicRoute) {
      setLocation("/login");
    } else if (user && isPublicRoute && location !== "/") {
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
        <p className="mt-4 text-sm text-muted-foreground font-medium animate-pulse">Initializing Neural Link...</p>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const { data: user } = useGetCurrentUser();

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        {/* If logged in but not onboarded, redirect to onboarding */}
        {!user.onboarded && location !== "/onboarding" && <Route path="*" component={() => {
           window.location.href = "/onboarding";
           return null;
        }} />}
        
        <Route path="/" component={user.hasProgram ? Dashboard : Paths} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/paths" component={Paths} />
        <Route path="/start" component={Start} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/program" component={Program} />
        <Route path="/progress" component={Progress} />
        <Route path="/coach" component={Coach} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthWrapper>
            <Router />
          </AuthWrapper>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
