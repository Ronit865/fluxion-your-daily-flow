import { NavLink } from "@/components/NavLink";
import { useTheme } from "next-themes";
import { Moon, Sun, User } from "lucide-react";
import { motion } from "framer-motion";

const navLinks = [
  { name: "Dashboard", path: "/" },
  { name: "Timetable", path: "/timetable" },
  { name: "Tasks", path: "/tasks" },
  { name: "Analytics", path: "/analytics" },
  { name: "Profile", path: "/profile" },
];

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-4 md:px-8 pt-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Black top navigation strip */}
        <nav className="hidden md:block">
          <div className="bg-nav-inner rounded-t-[2rem] px-6 py-4 flex items-center justify-center">
            <div className="flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-nav-text/70 transition-all duration-200 hover:text-nav-text"
                  activeClassName="text-nav-text"
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Beige container below */}
        <div className="bg-nav-outer rounded-b-[2rem] md:rounded-t-none rounded-t-[2rem] p-4 md:p-3">
          <div className="flex items-center justify-between px-2 md:px-4">
            {/* Logo */}
            <div className="flex items-center gap-2 py-2">
              <span className="font-bold text-xl text-foreground">
                fluxion<span className="text-primary">♦</span>
              </span>
            </div>

            {/* Right side - Theme toggle & CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              </button>

              <button className="bg-card text-foreground px-5 py-2.5 rounded-full font-medium text-sm border border-border hover:bg-secondary transition-colors flex items-center gap-2">
                <span>Join Us</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile navigation */}
        <nav className="md:hidden mt-3">
          <div className="bg-nav-inner rounded-2xl p-2 flex items-center justify-around">
            {navLinks.slice(0, 4).map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className="px-3 py-2 text-xs font-medium text-nav-text/70 rounded-xl transition-all duration-200"
                activeClassName="bg-primary text-primary-foreground"
              >
                {link.name}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
