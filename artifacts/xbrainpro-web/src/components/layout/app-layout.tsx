import { Link, useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, Map as MapIcon, BarChart3, MessageSquare, Bell, Settings as SettingsIcon } from "lucide-react";
import { useReminderNotifications } from "@/hooks/use-reminder-notifications";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetCurrentUser();
  // Keeps reminder notifications firing while any authenticated page is open.
  useReminderNotifications();

  const isPublic = ["/", "/login", "/register"].includes(location);
  const isOnboarding = location === "/onboarding" || location === "/paths" || location === "/start";

  if (isPublic || isOnboarding) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
        {children}
      </div>
    );
  }

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Daily" },
    { href: "/program", icon: MapIcon, label: "Journey" },
    { href: "/progress", icon: BarChart3, label: "Progress" },
    { href: "/coach", icon: MessageSquare, label: "Coach" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row overflow-hidden relative">
      {/* Dynamic background glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Sidebar / Bottom Nav */}
      <nav className="fixed bottom-0 w-full md:relative md:w-24 lg:w-64 md:h-[100dvh] bg-card/80 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/5 z-50 flex md:flex-col justify-between items-center md:items-start p-4 pb-safe">
        
        {/* Logo area - desktop only */}
        <div className="hidden md:flex items-center gap-3 mb-10 w-full px-2 lg:px-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold font-heading text-lg shadow-glow">
            X
          </div>
          <span className="hidden lg:block font-heading font-bold text-xl tracking-tight">XBrainPro</span>
        </div>

        {/* Nav Links */}
        <div className="flex w-full justify-around md:justify-start md:flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="w-full">
                <div className={`relative flex flex-col md:flex-row items-center md:items-center gap-1 md:gap-3 p-2 lg:px-4 lg:py-3 rounded-xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill" 
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10" 
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-6 h-6 md:w-5 md:h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]' : ''}`} />
                  <span className="text-[10px] md:text-sm font-medium hidden md:block">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Top/Bottom secondary actions */}
        <div className="hidden md:flex flex-col gap-2 w-full mt-auto">
          <Link href="/reminders" className="w-full">
            <div className={`flex items-center gap-3 p-2 lg:px-4 lg:py-3 rounded-xl transition-all duration-300 ${location === '/reminders' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
              <Bell className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:block">Reminders</span>
            </div>
          </Link>
          <Link href="/settings" className="w-full">
            <div className={`flex items-center gap-3 p-2 lg:px-4 lg:py-3 rounded-xl transition-all duration-300 ${location === '/settings' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
              <SettingsIcon className="w-5 h-5" />
              <span className="text-sm font-medium hidden lg:block">Settings</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 w-full h-[calc(100dvh-5rem)] md:h-[100dvh] overflow-y-auto overflow-x-hidden pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
