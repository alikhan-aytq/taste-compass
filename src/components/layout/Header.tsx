import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, User, LogOut, Heart, BookOpen, Calendar, ShoppingCart, Timer, Database, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: SupabaseUser | null;
}

export const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Show minimal header while role is loading to prevent flickering
  if (user && roleLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="bg-gradient-warm bg-clip-text text-transparent">TasteCompass</span>
          </div>
          <div className="h-10 w-10" /> {/* Placeholder for user menu */}
        </div>
      </header>
    );
  }
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Admin navigation
  if (user && isAdmin) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-xl">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="bg-gradient-warm bg-clip-text text-transparent">TasteCompass</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full ml-2">Admin</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Database className="h-4 w-4" />
              Recipes Database
            </Link>
            <Link to="/admin?tab=add" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Recipe
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/admin" className="flex items-center">
                    <Database className="mr-2 h-4 w-4" />
                    Recipes Database
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/admin?tab=add" className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Recipe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    );
  }

  // Regular user navigation
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="bg-gradient-warm bg-clip-text text-transparent">TasteCompass</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/recipes" className="text-sm font-medium hover:text-primary transition-colors">
            Recipes
          </Link>
          {user && (
            <>
              <Link to="/my-recipes" className="text-sm font-medium hover:text-primary transition-colors">
                My Recipes
              </Link>
              <Link to="/meal-plan" className="text-sm font-medium hover:text-primary transition-colors">
                Meal Plan
              </Link>
              <Link to="/shopping-list" className="text-sm font-medium hover:text-primary transition-colors">
                Shopping List
              </Link>
              <Link to="/cooking-timer" className="text-sm font-medium hover:text-primary transition-colors">
                Timer
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/my-recipes" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Recipes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/meal-plan" className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Meal Plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/shopping-list" className="flex items-center">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Shopping List
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/cooking-timer" className="flex items-center">
                    <Timer className="mr-2 h-4 w-4" />
                    Timer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};