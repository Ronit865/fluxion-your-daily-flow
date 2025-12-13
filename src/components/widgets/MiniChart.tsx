import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  color?: "orange" | "green" | "blue" | "yellow";
  height?: number;
  className?: string;
}

const colorMap = {
  orange: "bg-widget-tasks",
  green: "bg-widget-study",
  blue: "bg-widget-code",
  yellow: "bg-widget-focus",
};

export function MiniChart({
  data,
  color = "orange",
  height = 60,
  className,
}: MiniChartProps) {
  const max = Math.max(...data);

  return (
    <div
      className={cn("flex items-end gap-1", className)}
      style={{ height }}
    >
      {data.map((value, index) => {
        const barHeight = (value / max) * 100;
        return (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${barHeight}%` }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={cn(
              "flex-1 rounded-t-sm min-w-[4px]",
              colorMap[color],
              "opacity-60 hover:opacity-100 transition-opacity"
            )}
          />
        );
      })}
    </div>
  );
}
