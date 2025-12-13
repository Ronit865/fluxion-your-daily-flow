import { motion } from "framer-motion";
import { BookOpen, Code, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Study Hours",
    value: "4.5",
    unit: "h",
    icon: BookOpen,
    color: "green" as const,
    change: "+0.5h",
  },
  {
    label: "Coding Hours",
    value: "3.2",
    unit: "h",
    icon: Code,
    color: "blue" as const,
    change: "+1.2h",
  },
  {
    label: "Tasks Done",
    value: "8",
    unit: "/12",
    icon: Target,
    color: "orange" as const,
    change: "67%",
  },
  {
    label: "Productivity",
    value: "85",
    unit: "%",
    icon: Zap,
    color: "yellow" as const,
    change: "+5%",
  },
];

const colorStyles = {
  green: {
    iconBg: "bg-widget-study/10 dark:bg-widget-study/20",
    iconColor: "text-widget-study",
  },
  blue: {
    iconBg: "bg-widget-code/10 dark:bg-widget-code/20",
    iconColor: "text-widget-code",
  },
  orange: {
    iconBg: "bg-widget-tasks/10 dark:bg-widget-tasks/20",
    iconColor: "text-widget-tasks",
  },
  yellow: {
    iconBg: "bg-widget-focus/10 dark:bg-widget-focus/20",
    iconColor: "text-widget-focus",
  },
};

export function QuickStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const colors = colorStyles[stat.color];
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={cn(
              "rounded-2xl p-4 bg-card border border-border/50",
              "shadow-card hover:shadow-soft transition-all duration-300"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-xl", colors.iconBg)}>
                <stat.icon className={cn("w-4 h-4", colors.iconColor)} />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {stat.label}
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={cn("font-mono text-3xl font-bold", colors.iconColor)}>
                {stat.value}
              </span>
              <span className="text-lg text-muted-foreground">{stat.unit}</span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-widget-study">{stat.change}</span> today
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
