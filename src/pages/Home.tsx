import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChefHat, Clock, Heart, BookOpen, Database, PlusCircle, TrendingUp, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import heroImage from "@/assets/hero-cooking.jpg";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  difficulty: string | null;
  category: string | null;
}

interface RecipeWithFavorites extends Recipe {
  favorites: { count: number }[];
}

const Home = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [featuredRecipes, setFeaturedRecipes] = useState<RecipeWithFavorites[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ totalRecipes: 0, totalFavorites: 0, recentRecipes: 0 });
  const navigate = useNavigate();

  const fetchFeaturedRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*, favorites(count)")
      .eq("is_public", true);

    if (error) {
      console.error("Error fetching recipes:", error);
      return;
    }

    // Sort by favorites count (most favorited first) and take top 6
    const sorted = (data as RecipeWithFavorites[] || [])
      .sort((a, b) => {
        const countA = a.favorites?.[0]?.count || 0;
        const countB = b.favorites?.[0]?.count || 0;
        return countB - countA;
      })
      .slice(0, 6);

    setFeaturedRecipes(sorted);
  };

  const fetchAdminStats = useCallback(async () => {
    if (!isAdmin) return;

    // Fetch total recipes
    const { count: totalRecipes } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true });

    // Fetch total favorites
    const { count: totalFavorites } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true });

    // Fetch recipes from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: recentRecipes } = await supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    setStats({
      totalRecipes: totalRecipes || 0,
      totalFavorites: totalFavorites || 0,
      recentRecipes: recentRecipes || 0,
    });
  }, [isAdmin]);

  const fetchUserFavorites = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("favorites")
      .select("recipe_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching user favorites:", error);
      return;
    }

    setUserFavorites(data.map((f) => f.recipe_id));
  }, [user]);

  useEffect(() => {
    fetchFeaturedRecipes();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserFavorites();
    } else {
      setUserFavorites([]);
    }
  }, [user, fetchUserFavorites]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin, fetchAdminStats]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Show loading while checking role
  if (user && roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container py-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (user && isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        
        <div className="container py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your recipe database.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Recipes</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalRecipes}</div>
                <p className="text-xs text-muted-foreground">recipes in database</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Favorites</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalFavorites}</div>
                <p className="text-xs text-muted-foreground">times recipes were favorited</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.recentRecipes}</div>
                <p className="text-xs text-muted-foreground">new recipes added</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <Button asChild size="lg" className="h-auto py-6">
                <Link to="/admin?tab=database" className="flex flex-col items-center gap-2">
                  <Database className="h-6 w-6" />
                  <span>Manage Recipes</span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-auto py-6">
                <Link to="/admin?tab=add" className="flex flex-col items-center gap-2">
                  <PlusCircle className="h-6 w-6" />
                  <span>Add New Recipe</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Popular Recipes Preview */}
          {featuredRecipes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Most Popular Recipes</h2>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin?tab=database">View All</Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredRecipes.slice(0, 3).map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    description={recipe.description}
                    imageUrl={recipe.image_url}
                    prepTime={recipe.prep_time}
                    cookTime={recipe.cook_time}
                    servings={recipe.servings}
                    difficulty={recipe.difficulty}
                    category={recipe.category}
                    userId={user?.id}
                    isFavorite={userFavorites.includes(recipe.id)}
                    favoritesCount={recipe.favorites?.[0]?.count || 0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular User / Guest Home Page
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container relative py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Discover a world of <span className="bg-gradient-warm bg-clip-text text-transparent">delicious recipes</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Over 1000 tested recipes for every occasion. Create menus, manage shopping, and cook with joy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Find a recipe..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10 h-12"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="h-12">
                  Search
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-large">
                <img
                  src={heroImage}
                  alt="Cooking ingredients"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Smart Search</h3>
            <p className="text-muted-foreground">
              Find recipes by ingredients, category, or difficulty
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Cooking Timer</h3>
            <p className="text-muted-foreground">
              Built-in timer helps you never miss an important moment
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Weekly Menu</h3>
            <p className="text-muted-foreground">
              Plan your meals in advance and save time
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Favorites</h3>
            <p className="text-muted-foreground">
              Save your favorite recipes and share them
            </p>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featuredRecipes.length > 0 && (
        <section className="container py-16 md:py-24 bg-muted/30">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Popular Recipes</h2>
              <p className="text-muted-foreground">Recipes loved by our users</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/recipes">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                imageUrl={recipe.image_url}
                prepTime={recipe.prep_time}
                cookTime={recipe.cook_time}
                servings={recipe.servings}
                difficulty={recipe.difficulty}
                category={recipe.category}
                userId={user?.id}
                isFavorite={userFavorites.includes(recipe.id)}
                favoritesCount={recipe.favorites?.[0]?.count || 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="container py-16 md:py-24">
          <div className="bg-gradient-warm rounded-2xl p-12 text-center text-white">
            <ChefHat className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start cooking with us
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Create an account and get access to all features
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Join for Free</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
