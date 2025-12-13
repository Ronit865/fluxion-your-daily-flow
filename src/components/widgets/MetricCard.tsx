import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: "orange" | "green" | "blue" | "yellow";
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
  children?: React.ReactNode;
}

const colorMap = {
  orange: {
    bg: "bg-widget-tasks/10 dark:bg-widget-tasks/20",
    text: "text-widget-tasks",
    glow: "dark:shadow-glow-orange",
    border: "border-widget-tasks/20",
  },
  green: {
    bg: "bg-widget-study/10 dark:bg-widget-study/20",
    text: "text-widget-study",
    glow: "dark:shadow-glow-green",
    border: "border-widget-study/20",
  },
  blue: {
    bg: "bg-widget-code/10 dark:bg-widget-code/20",
    text: "text-widget-code",
    glow: "dark:shadow-glow-blue",
    border: "border-widget-code/20",
  },
  yellow: {
    bg: "bg-widget-focus/10 dark:bg-widget-focus/20",
    text: "text-widget-focus",
    glow: "dark:shadow-glow-yellow",
    border: "border-widget-focus/20",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "orange",
  size = "md",
  className,
  delay = 0,
  children,
}: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "rounded-3xl p-6 bg-card border transition-all duration-300",
        "shadow-card hover:shadow-soft",
        colors.glow,
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-xl", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span
          className={cn(
            "font-mono font-bold",
            colors.text,
            size === "lg" && "text-5xl md:text-6xl",
            size === "md" && "text-4xl md:text-5xl",
            size === "sm" && "text-2xl md:text-3xl"
          )}
        >
          {value}
        </span>
        {children}
      </div>
    </motion.div>
  );
}
