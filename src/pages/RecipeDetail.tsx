import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Users, ChefHat, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

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
  cuisine: string | null;
  ingredients: Json;
  instructions: Json;
  user_id: string | null;
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching recipe:", error);
        toast({
          title: "Error",
          description: "Recipe not found",
          variant: "destructive",
        });
        navigate("/recipes");
        return;
      }

      setRecipe(data);

      if (user) {
        const { data: favData } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("recipe_id", id)
          .single();

        setIsFavorite(!!favData);
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate, toast, user]);

  const handleToggleFavorite = async () => {
    if (!user || !id) {
      toast({
        title: "Authentication required",
        description: "Sign in to add to favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id);
        setIsFavorite(false);
        toast({ title: "Removed from favorites" });
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, recipe_id: id });
        setIsFavorite(true);
        toast({ title: "Added to favorites" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) return null;

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <ChefHat className="h-16 w-16" />
                </div>
              )}
            </div>

            <Button
              variant={isFavorite ? "default" : "outline"}
              onClick={handleToggleFavorite}
              className="w-full"
            >
              <Heart className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
              {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            </Button>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-muted-foreground">{recipe.description}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
              {recipe.cuisine && <Badge variant="outline">{recipe.cuisine}</Badge>}
              {recipe.difficulty && (
                <Badge
                  variant="outline"
                  className={
                    recipe.difficulty === "easy"
                      ? "border-secondary text-secondary"
                      : recipe.difficulty === "medium"
                      ? "border-accent text-accent"
                      : "border-destructive text-destructive"
                  }
                >
                  {recipe.difficulty === "easy" ? "Easy" : recipe.difficulty === "medium" ? "Medium" : "Hard"}
                </Badge>
              )}
            </div>

            <div className="flex gap-6 text-sm">
              {totalTime > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{totalTime} min</p>
                    <p className="text-muted-foreground text-xs">Total time</p>
                  </div>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{recipe.servings}</p>
                    <p className="text-muted-foreground text-xs">Servings</p>
                  </div>
                </div>
              )}
              {recipe.prep_time && (
                <div>
                  <p className="font-medium">{recipe.prep_time} min</p>
                  <p className="text-muted-foreground text-xs">Prep time</p>
                </div>
              )}
              {recipe.cook_time && (
                <div>
                  <p className="font-medium">{recipe.cook_time} min</p>
                  <p className="text-muted-foreground text-xs">Cook time</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Ingredients */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
                {ingredients.length > 0 ? (
                  <ul className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{String(ingredient)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No ingredients listed</p>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                {instructions.length > 0 ? (
                  <ol className="space-y-4">
                    {instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <p className="pt-1">{String(instruction)}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-muted-foreground">No instructions listed</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
