import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TimeWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const day = time.toLocaleDateString("en-US", { weekday: "long" });
  const date = time.getDate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-3xl p-6 bg-card border border-border/50",
        "shadow-card hover:shadow-soft transition-all duration-300",
        "dark:shadow-glow-orange"
      )}
    >
      <div className="flex flex-col">
        <span className="text-muted-foreground text-lg font-medium">
          {day} <span className="text-primary">{date}</span>
        </span>

        <div className="flex items-baseline mt-2">
          <span className="font-mono text-6xl md:text-7xl font-bold text-foreground tracking-tight">
            {hours}:{minutes}
          </span>
          <span className="font-mono text-2xl font-medium text-primary ml-1">
            {seconds}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-widget-study animate-pulse" />
            <span className="text-sm text-muted-foreground">Focus Mode</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
