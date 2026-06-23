import { NavLink } from "react-router-dom";
import { LayoutDashboard, Gauge, Plug, Settings, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "../ui/button.js";
import { useTheme } from "../../hooks/use-theme.js";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forecast", label: "Forecast", icon: Gauge },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Burnwise" className="h-8 w-8" />
            <span className="text-lg font-semibold tracking-tight">Burnwise</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>
      <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
