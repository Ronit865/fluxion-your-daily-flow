import { Navbar } from "@/components/Navbar";
import { TimeWidget } from "@/components/widgets/TimeWidget";
import { QuickStats } from "@/components/widgets/QuickStats";
import { FocusWidget } from "@/components/widgets/FocusWidget";
import { TasksPreview } from "@/components/widgets/TasksPreview";
import { WeeklyChart } from "@/components/widgets/WeeklyChart";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Good morning, Developer
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's make today productive. You have <span className="text-primary font-medium">4 tasks</span> scheduled.
          </p>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="mb-6">
          <QuickStats />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <TimeWidget />
            <WeeklyChart />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FocusWidget />
            <TasksPreview />
          </div>
        </div>

        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            "Consistency is the key to mastery" — Keep building your streak!
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
