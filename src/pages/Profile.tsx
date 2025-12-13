import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { User, Mail, Target, Bell, Palette, Moon, Sun, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Profile & Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your Fluxion experience
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 bg-card border border-border/50 shadow-card mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">D</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Developer</h2>
              <p className="text-muted-foreground">Computer Science Student</p>
              <p className="text-sm text-primary mt-1">🔥 15 day streak</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Account Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-card border border-border/50 shadow-card overflow-hidden"
          >
            <h3 className="px-6 py-4 font-semibold text-foreground border-b border-border">
              Account
            </h3>
            
            <div className="divide-y divide-border">
              {[
                { icon: User, label: "Display Name", value: "Developer" },
                { icon: Mail, label: "Email", value: "dev@example.com" },
                { icon: Target, label: "Daily Goal", value: "6 hours" },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">{item.value}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-card border border-border/50 shadow-card overflow-hidden"
          >
            <h3 className="px-6 py-4 font-semibold text-foreground border-b border-border">
              Appearance
            </h3>

            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-5 h-5 text-widget-tasks" />
                    <span className="font-medium text-foreground">Light</span>
                  </div>
                  <div className="h-16 rounded-xl bg-[hsl(40,33%,96%)] border border-[hsl(40,20%,88%)] flex items-end p-2">
                    <div className="flex gap-1">
                      <div className="w-8 h-6 rounded bg-[hsl(85,35%,45%)]" />
                      <div className="w-6 h-8 rounded bg-[hsl(210,45%,55%)]" />
                      <div className="w-10 h-4 rounded bg-[hsl(24,90%,55%)]" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all",
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Moon className="w-5 h-5 text-widget-code" />
                    <span className="font-medium text-foreground">Dark</span>
                  </div>
                  <div className="h-16 rounded-xl bg-[hsl(0,0%,8%)] border border-[hsl(0,0%,16%)] flex items-end p-2">
                    <div className="flex gap-1">
                      <div className="w-8 h-6 rounded bg-[hsl(145,80%,50%)]" />
                      <div className="w-6 h-8 rounded bg-[hsl(200,100%,55%)]" />
                      <div className="w-10 h-4 rounded bg-[hsl(24,100%,55%)]" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl bg-card border border-border/50 shadow-card overflow-hidden"
          >
            <h3 className="px-6 py-4 font-semibold text-foreground border-b border-border">
              Notifications
            </h3>

            <div className="p-6 space-y-4">
              {[
                { label: "Daily reminders", description: "Get notified about your scheduled tasks", enabled: true },
                { label: "Streak alerts", description: "Remind me to maintain my streak", enabled: true },
                { label: "Weekly reports", description: "Receive weekly progress summaries", enabled: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <button
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative",
                      item.enabled ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-5 h-5 rounded-full bg-primary-foreground transition-all",
                        item.enabled ? "left-6" : "left-1"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
