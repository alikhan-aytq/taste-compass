import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

const MyRecipes = () => {
  const { user, loading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const fetchMyRecipes = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
      return;
    }

    setRecipes(data || []);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyRecipes();
    }
  }, [user, fetchMyRecipes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Recipes</h1>
            <p className="text-muted-foreground">Manage your personal recipes</p>
          </div>
          <Button asChild>
            <Link to="/create-recipe">
              <Plus className="h-4 w-4 mr-2" />
              Create Recipe
            </Link>
          </Button>
        </div>

        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You have no recipes yet</p>
            <Button asChild>
              <Link to="/create-recipe">Create your first recipe</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
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
        )}
      </main>
    </div>
  );
};

export default MyRecipes;
