import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChefHat, User, LogOut, Heart, BookOpen, Calendar, ShoppingCart, ShieldCheck } from "lucide-react";
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
  const { isAdmin } = useUserRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat className="h-6 w-6 text-primary" />
          <span className="bg-gradient-warm bg-clip-text text-transparent">RecipeHub</span>
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
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
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
