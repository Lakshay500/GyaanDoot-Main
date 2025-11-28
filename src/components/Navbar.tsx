import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, Plus, Library, LayoutDashboard, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeControls } from "@/components/ThemeControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export const Navbar = () => {
  const { user, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  const handleResetTour = () => {
    localStorage.removeItem("hasSeenWelcome");
    toast({
      title: "Tour Reset",
      description: "Refresh the page to see the welcome tour again.",
    });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 transition-all duration-300 hover:opacity-80 hover:scale-105"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GyaanDoot
            </span>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Button variant="ghost" size="sm" onClick={() => navigate("/courses")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105">
              Courses
            </Button>
            {user && (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/my-courses")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105 flex items-center gap-1">
                  <Library className="w-4 h-4" />
                  My Courses
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/leaderboard")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105">
                  Leaderboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/mentors")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105">
                  Mentors
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/ai-tools")} className="text-sm font-medium hover:text-primary transition-all duration-300 hover:scale-105">
                  AI Tools
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/courses/new")}
                  className="text-primary hover:text-primary transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create Course
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/features")} className="text-sm font-medium hover:text-primary">
              Features
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/demo")} className="text-sm font-medium hover:text-primary">
              Demo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/roles")} className="text-sm font-medium hover:text-primary">
              Roles
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/about")} className="text-sm font-medium hover:text-primary">
              About
            </Button>
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <ThemeControls />
            {user && <NotificationCenter />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {roles.join(', ')}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleResetTour}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Welcome Tour
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" className="hidden md:inline-flex" onClick={() => navigate('/auth')}>
                  Log In
                </Button>
                <Button variant="default" onClick={() => navigate('/auth')}>
                  Sign Up
                </Button>
              </>
            )}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <a href="/courses" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Courses</a>
                  {user && (
                    <>
                      <a href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </a>
                   <a href="/my-courses" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1" onClick={() => setMobileMenuOpen(false)}>
                        <Library className="w-4 h-4" />
                        My Courses
                      </a>
                      <a href="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Leaderboard</a>
                      <a href="/mentors" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Mentors</a>
                      <a href="/ai-tools" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>AI Tools</a>
                      <Button
                        variant="ghost"
                        className="justify-start px-0"
                        onClick={() => {
                          navigate("/courses/new");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Course
                      </Button>
                    </>
                  )}
                  <a href="/features" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
                  <a href="/demo" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Demo</a>
                  <a href="/roles" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Roles</a>
                  <a href="/about" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>About</a>
                  
                  {user ? (
                    <>
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-1">{user.email}</p>
                        <p className="text-xs text-muted-foreground capitalize mb-4">{roles.join(', ')}</p>
                        <Button variant="outline" className="w-full mb-2" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        <Button variant="outline" className="w-full mb-2" onClick={() => { handleResetTour(); setMobileMenuOpen(false); }}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset Tour
                        </Button>
                        <Button variant="outline" className="w-full" onClick={signOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-4">
                      <Button variant="outline" className="w-full mb-2" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                        Log In
                      </Button>
                      <Button className="w-full" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                        Sign Up
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};