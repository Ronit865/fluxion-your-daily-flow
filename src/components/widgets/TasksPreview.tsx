import { motion } from "framer-motion";
import { CheckCircle2, Circle, Code, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  type: "study" | "code";
  completed: boolean;
  duration?: string;
}

const sampleTasks: Task[] = [
  { id: "1", title: "Algorithm practice", type: "code", completed: true, duration: "45m" },
  { id: "2", title: "Read Chapter 5", type: "study", completed: true, duration: "30m" },
  { id: "3", title: "Build API endpoint", type: "code", completed: false, duration: "1h" },
  { id: "4", title: "Review notes", type: "study", completed: false, duration: "20m" },
];

export function TasksPreview() {
  const completedCount = sampleTasks.filter((t) => t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        "rounded-3xl p-6 bg-card border border-border/50",
        "shadow-card hover:shadow-soft transition-all duration-300"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Today's Tasks</h3>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{sampleTasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {sampleTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              "hover:bg-muted/50",
              task.completed && "opacity-60"
            )}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-widget-study shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {task.type === "code" ? (
                <Code className="w-4 h-4 text-widget-code" />
              ) : (
                <BookOpen className="w-4 h-4 text-widget-study" />
              )}
              <span className="text-xs text-muted-foreground">{task.duration}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
