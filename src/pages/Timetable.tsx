import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

const scheduleBlocks = [
  { id: 1, title: "Algorithm Study", start: "09:00", end: "11:00", type: "study", color: "green" },
  { id: 2, title: "Project Work", start: "11:00", end: "13:00", type: "code", color: "blue" },
  { id: 3, title: "Lunch Break", start: "13:00", end: "14:00", type: "break", color: "muted" },
  { id: 4, title: "React Tutorial", start: "14:00", end: "16:00", type: "code", color: "blue" },
  { id: 5, title: "Review & Notes", start: "16:00", end: "17:00", type: "study", color: "green" },
];

const colorMap: Record<string, string> = {
  green: "bg-widget-study border-widget-study/30",
  blue: "bg-widget-code border-widget-code/30",
  orange: "bg-widget-tasks border-widget-tasks/30",
  muted: "bg-muted border-border",
};

const Timetable = () => {
  const getBlockPosition = (start: string) => {
    const startIndex = timeSlots.indexOf(start);
    return startIndex >= 0 ? startIndex : 0;
  };

  const getBlockSpan = (start: string, end: string) => {
    const startIndex = timeSlots.indexOf(start);
    const endIndex = timeSlots.indexOf(end);
    return Math.max(1, endIndex - startIndex);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Timetable
            </h1>
            <p className="text-muted-foreground">
              Plan and organize your day effectively
            </p>
          </div>

          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Add Block
          </button>
        </motion.div>

        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <button className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Friday, December 13</h2>
            <p className="text-sm text-muted-foreground">Today</p>
          </div>
          <button className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Schedule Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl bg-card border border-border/50 p-6 shadow-card"
        >
          <div className="grid grid-cols-[80px_1fr] gap-4">
            {/* Time labels */}
            <div className="space-y-0">
              {timeSlots.map((time) => (
                <div key={time} className="h-20 flex items-start">
                  <span className="text-sm font-mono text-muted-foreground">{time}</span>
                </div>
              ))}
            </div>

            {/* Schedule blocks */}
            <div className="relative">
              {/* Grid lines */}
              {timeSlots.map((_, i) => (
                <div
                  key={i}
                  className="h-20 border-t border-border/50"
                />
              ))}

              {/* Blocks */}
              <div className="absolute inset-0">
                {scheduleBlocks.map((block, index) => {
                  const top = getBlockPosition(block.start) * 80;
                  const height = getBlockSpan(block.start, block.end) * 80 - 8;

                  return (
                    <motion.div
                      key={block.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={cn(
                        "absolute left-0 right-4 rounded-xl p-3 border cursor-pointer",
                        "hover:scale-[1.02] transition-transform",
                        block.color === "muted"
                          ? "bg-muted/50 border-border"
                          : colorMap[block.color]
                      )}
                      style={{ top, height }}
                    >
                      <p className={cn(
                        "font-medium text-sm",
                        block.color === "muted" ? "text-muted-foreground" : "text-primary-foreground"
                      )}>
                        {block.title}
                      </p>
                      <p className={cn(
                        "text-xs mt-1",
                        block.color === "muted" ? "text-muted-foreground" : "text-primary-foreground/70"
                      )}>
                        {block.start} - {block.end}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Timetable;
