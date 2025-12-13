import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Code, Target, Calendar } from "lucide-react";
import { ProgressRing } from "@/components/widgets/ProgressRing";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const weeklyData = [
  { name: "Mon", study: 4.5, code: 2.5 },
  { name: "Tue", study: 3.8, code: 4.2 },
  { name: "Wed", study: 5.2, code: 3.5 },
  { name: "Thu", study: 4.0, code: 5.0 },
  { name: "Fri", study: 3.5, code: 4.8 },
  { name: "Sat", study: 2.0, code: 3.0 },
  { name: "Sun", study: 4.2, code: 2.8 },
];

const skillBalance = [
  { skill: "Algorithms", value: 78 },
  { skill: "System Design", value: 65 },
  { skill: "Frontend", value: 85 },
  { skill: "Backend", value: 72 },
  { skill: "DevOps", value: 45 },
];

const Analytics = () => {
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
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your progress and identify areas for improvement
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Hours", value: "127", icon: Calendar, color: "orange" },
            { label: "Study Hours", value: "68", icon: BookOpen, color: "green" },
            { label: "Coding Hours", value: "59", icon: Code, color: "blue" },
            { label: "Tasks Completed", value: "84", icon: Target, color: "yellow" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl p-4 bg-card border border-border/50 shadow-card"
            >
              <stat.icon className={cn(
                "w-5 h-5 mb-3",
                stat.color === "orange" && "text-widget-tasks",
                stat.color === "green" && "text-widget-study",
                stat.color === "blue" && "text-widget-code",
                stat.color === "yellow" && "text-widget-focus"
              )} />
              <p className="font-mono text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-3xl p-6 bg-card border border-border/50 shadow-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Weekly Activity</h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-widget-study" />
                  Study
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-widget-code" />
                  Code
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--widget-study))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--widget-study))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="codeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--widget-code))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--widget-code))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="study"
                    stroke="hsl(var(--widget-study))"
                    fill="url(#studyGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="code"
                    stroke="hsl(var(--widget-code))"
                    fill="url(#codeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Skill Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-6 bg-card border border-border/50 shadow-card"
          >
            <h3 className="font-semibold text-foreground mb-6">Skill Balance</h3>

            <div className="space-y-4">
              {skillBalance.map((skill, index) => (
                <div key={skill.skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{skill.skill}</span>
                    <span className="font-mono text-foreground">{skill.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.value}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        index % 3 === 0 && "bg-widget-study",
                        index % 3 === 1 && "bg-widget-code",
                        index % 3 === 2 && "bg-widget-tasks"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-3xl p-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-primary/20">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">AI Insights</h3>
              <p className="text-muted-foreground">
                Your coding productivity peaks in the afternoon. Consider scheduling complex coding tasks between 2-5 PM.
                Your study consistency has improved by 15% this week — keep it up!
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
