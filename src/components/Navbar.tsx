import { NavLink } from "@/components/NavLink";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
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
        {/* Main container - beige with carved black strip */}
        <div className="relative bg-nav-outer rounded-[2rem] overflow-hidden">
          {/* Black navigation strip - carved into top */}
          <div className="hidden md:block relative">
            {/* The black strip */}
            <div className="bg-nav-inner mx-4 rounded-b-[1.5rem] px-8 py-4 flex items-center justify-center">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className="text-sm font-medium text-nav-text/60 transition-all duration-200 hover:text-nav-text"
                    activeClassName="text-nav-text"
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>
            
            {/* Curved corners that make it look carved in */}
            <div className="absolute top-0 left-0 w-4 h-full bg-nav-outer">
              <div className="absolute top-0 right-0 w-4 h-[3.5rem] bg-nav-inner rounded-bl-[1rem]" />
            </div>
            <div className="absolute top-0 right-0 w-4 h-full bg-nav-outer">
              <div className="absolute top-0 left-0 w-4 h-[3.5rem] bg-nav-inner rounded-br-[1rem]" />
            </div>
          </div>

          {/* Bottom section with logo and button */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <div className="flex items-center gap-1">
              <span className="font-bold text-xl text-foreground lowercase">
                fluxion
              </span>
              <span className="text-primary text-xl">♦</span>
            </div>

            {/* Right side - Theme toggle & CTA */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
              </button>

              <button className="bg-transparent text-foreground px-6 py-2.5 rounded-full font-medium text-sm border border-border hover:bg-secondary/50 transition-colors min-w-[100px]">
                Join Us
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
