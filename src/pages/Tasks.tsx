import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { BookOpen, Code, CheckCircle2, Circle, Clock, Flame, Plus, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  streak?: number;
}

const studyTasks: Task[] = [
  { id: "s1", title: "Data Structures Chapter 8", duration: "45 min", completed: true },
  { id: "s2", title: "Practice Leetcode Problems", duration: "1 hour", completed: false, streak: 5 },
  { id: "s3", title: "Watch System Design Video", duration: "30 min", completed: false },
  { id: "s4", title: "Review Notes", duration: "20 min", completed: false },
];

const codingTasks: Task[] = [
  { id: "c1", title: "Build REST API", duration: "2 hours", completed: true },
  { id: "c2", title: "Fix Authentication Bug", duration: "45 min", completed: false, streak: 3 },
  { id: "c3", title: "Write Unit Tests", duration: "1 hour", completed: false },
  { id: "c4", title: "Code Review PRs", duration: "30 min", completed: false },
];

function TaskCard({ task, type }: { task: Task; type: "study" | "code" }) {
  const [isCompleted, setIsCompleted] = useState(task.completed);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl border transition-all duration-300",
        "hover:shadow-soft cursor-pointer group",
        isCompleted
          ? "bg-muted/50 border-border"
          : "bg-card border-border/50"
      )}
      onClick={() => setIsCompleted(!isCompleted)}
    >
      <div className="flex items-start gap-3">
        <button className="mt-0.5 shrink-0">
          {isCompleted ? (
            <CheckCircle2 className={cn(
              "w-5 h-5",
              type === "study" ? "text-widget-study" : "text-widget-code"
            )} />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {task.duration}
            </span>
            {task.streak && !isCompleted && (
              <span className="flex items-center gap-1 text-xs text-widget-tasks">
                <Flame className="w-3 h-3" />
                {task.streak} day streak
              </span>
            )}
          </div>
        </div>

        {!isCompleted && (
          <button className={cn(
            "p-2 rounded-xl transition-colors opacity-0 group-hover:opacity-100",
            type === "study"
              ? "bg-widget-study/10 hover:bg-widget-study/20"
              : "bg-widget-code/10 hover:bg-widget-code/20"
          )}>
            <Play className={cn(
              "w-4 h-4",
              type === "study" ? "text-widget-study" : "text-widget-code"
            )} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

const Tasks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Track your study and coding progress
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-widget-study/10">
                  <BookOpen className="w-5 h-5 text-widget-study" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Study Tasks</h2>
                  <p className="text-sm text-muted-foreground">1/4 completed</p>
                </div>
              </div>
              <button className="p-2 rounded-xl bg-widget-study/10 hover:bg-widget-study/20 transition-colors">
                <Plus className="w-5 h-5 text-widget-study" />
              </button>
            </div>

            <div className="space-y-3">
              {studyTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} type="study" />
              ))}
            </div>
          </motion.div>

          {/* Coding Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-widget-code/10">
                  <Code className="w-5 h-5 text-widget-code" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Coding Tasks</h2>
                  <p className="text-sm text-muted-foreground">1/4 completed</p>
                </div>
              </div>
              <button className="p-2 rounded-xl bg-widget-code/10 hover:bg-widget-code/20 transition-colors">
                <Plus className="w-5 h-5 text-widget-code" />
              </button>
            </div>

            <div className="space-y-3">
              {codingTasks.map((task, index) => (
                <TaskCard key={task.id} task={task} type="code" />
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Tasks;
