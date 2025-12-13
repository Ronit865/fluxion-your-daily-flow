import { motion } from "framer-motion";
import { ProgressRing } from "./ProgressRing";
import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FocusWidget() {
  const focusScore = 78;
  const streak = 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "rounded-3xl p-6 bg-card border border-border/50",
        "shadow-card hover:shadow-soft transition-all duration-300",
        "dark:shadow-glow-yellow"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Focus Score</h3>
        <div className="flex items-center gap-1 text-widget-tasks">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-medium">{streak} day streak</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <ProgressRing
          progress={focusScore}
          size={140}
          strokeWidth={10}
          color="hsl(var(--widget-focus))"
        >
          <div className="text-center">
            <span className="font-mono text-4xl font-bold text-foreground">
              {focusScore}
            </span>
            <span className="text-lg text-muted-foreground">%</span>
          </div>
        </ProgressRing>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2">
        <TrendingUp className="w-4 h-4 text-widget-study" />
        <span className="text-sm text-muted-foreground">
          +12% from last week
        </span>
      </div>
    </motion.div>
  );
}
