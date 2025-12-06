import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Search, ChefHat, Clock, Heart, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const Home = () => {
  const { user } = useAuth();
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedRecipes();
  }, []);

  const fetchFeaturedRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error fetching recipes:", error);
      return;
    }

    setFeaturedRecipes(data || []);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery)}`);
    }
  };

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
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
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
