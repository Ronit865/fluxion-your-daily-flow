import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const weekData = [
  { day: "Mon", study: 3.5, code: 2 },
  { day: "Tue", study: 4, code: 3 },
  { day: "Wed", study: 2.5, code: 4 },
  { day: "Thu", study: 5, code: 2.5 },
  { day: "Fri", study: 3, code: 5 },
  { day: "Sat", study: 2, code: 3.5 },
  { day: "Sun", study: 4.5, code: 2 },
];

export function WeeklyChart() {
  const maxValue = Math.max(...weekData.map((d) => d.study + d.code));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={cn(
        "rounded-3xl p-6 bg-card border border-border/50",
        "shadow-card hover:shadow-soft transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Weekly Activity</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-widget-study" />
            <span className="text-muted-foreground">Study</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-widget-code" />
            <span className="text-muted-foreground">Code</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((data, index) => {
          const studyHeight = (data.study / maxValue) * 100;
          const codeHeight = (data.code / maxValue) * 100;

          return (
            <div key={data.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5" style={{ height: 100 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${codeHeight}%` }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                  className="w-full bg-widget-code rounded-t-md"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${studyHeight}%` }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                  className="w-full bg-widget-study rounded-t-md"
                />
              </div>
              <span className="text-xs text-muted-foreground mt-2">{data.day}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
