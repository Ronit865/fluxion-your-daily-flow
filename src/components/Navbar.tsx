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
      className="w-full px-4 md:px-8 py-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Outer beige container */}
        <div className="bg-nav-outer rounded-[2rem] p-2 shadow-soft">
          <div className="flex items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center gap-2 py-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-xl text-foreground hidden sm:block">
                Fluxion
              </span>
            </div>

            {/* Black navigation strip - Crypko style */}
            <nav className="hidden md:flex items-center">
              <div className="bg-nav-inner rounded-full px-2 py-1.5 flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className="px-4 py-2 text-sm font-medium text-nav-text/70 rounded-full transition-all duration-200 hover:text-nav-text"
                    activeClassName="bg-primary text-primary-foreground"
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* Right side - Theme toggle & CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              </button>

              <button className="bg-nav-inner text-nav-text px-5 py-2.5 rounded-full font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Join Us</span>
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
