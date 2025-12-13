import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Generate 16 weeks of mock activity data (like GitHub)
const generateActivityData = () => {
  const weeks = [];
  for (let w = 0; w < 16; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      // Random activity level 0-4
      week.push(Math.floor(Math.random() * 5));
    }
    weeks.push(week);
  }
  return weeks;
};

const activityData = generateActivityData();
const days = ["Mon", "", "Wed", "", "Fri", "", ""];

const getActivityColor = (level: number) => {
  switch (level) {
    case 0:
      return "bg-muted";
    case 1:
      return "bg-widget-study/30";
    case 2:
      return "bg-widget-study/50";
    case 3:
      return "bg-widget-study/75";
    case 4:
      return "bg-widget-study";
    default:
      return "bg-muted";
  }
};

export function WeeklyChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={cn(
        "rounded-3xl p-6 bg-card border border-border/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Activity</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn("w-3 h-3 rounded-sm", getActivityColor(level))}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-2 pt-0">
          {days.map((day, i) => (
            <div key={i} className="h-3 text-[10px] text-muted-foreground flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Activity grid */}
        <div className="flex gap-0.5 overflow-hidden flex-1">
          {activityData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((level, dayIndex) => (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.2, 
                    delay: 0.3 + weekIndex * 0.02 + dayIndex * 0.01 
                  }}
                  className={cn(
                    "w-3 h-3 rounded-sm transition-colors",
                    getActivityColor(level)
                  )}
                  title={`Activity level: ${level}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
