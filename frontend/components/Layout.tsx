import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Settings, 
  LogOut,
  Video
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Upload", href: "/upload", icon: Upload },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="flex w-64 flex-col bg-card border-r">
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <Video className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">TikTok Manager</h1>
        </div>
        
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium text-foreground">{user?.email}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
