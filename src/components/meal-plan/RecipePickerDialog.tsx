import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Clock, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
}

interface RecipePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  userId: string;
}

export const RecipePickerDialog = ({
  open,
  onOpenChange,
  onSelectRecipe,
  userId,
}: RecipePickerDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sharedRecipes, setSharedRecipes] = useState<Recipe[]>([]);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (open) {
      fetchAllRecipes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const fetchAllRecipes = async () => {
    setLoading(true);
    try {
      // Fetch shared/public recipes
      const { data: shared } = await supabase
        .from("recipes")
        .select("id, title, image_url, prep_time, cook_time, servings")
        .eq("is_public", true)
        .order("title");

      setSharedRecipes(shared || []);

      // Fetch my recipes
      const { data: mine } = await supabase
        .from("recipes")
        .select("id, title, image_url, prep_time, cook_time, servings")
        .eq("user_id", userId)
        .order("title");

      setMyRecipes(mine || []);

      // Fetch favorites
      const { data: favs } = await supabase
        .from("favorites")
        .select(`
          recipe_id,
          recipes (
            id,
            title,
            image_url,
            prep_time,
            cook_time,
            servings
          )
        `)
        .eq("user_id", userId);

      const favoritesList = (favs as unknown as { recipe_id: string; recipes: Recipe | null }[])
        ?.map((f) => f.recipes)
        .filter((r): r is Recipe => r !== null) || [];

      setFavoriteRecipes(favoritesList);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = (recipes: Recipe[]) => {
    if (!searchQuery) return recipes;
    return recipes.filter((r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const RecipeList = ({ recipes }: { recipes: Recipe[] }) => {
    const filtered = filterRecipes(recipes);

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No recipes found
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filtered.map((recipe) => (
          <Button
            key={recipe.id}
            variant="ghost"
            className="w-full justify-start h-auto p-3 hover:bg-accent"
            onClick={() => {
              onSelectRecipe(recipe);
              onOpenChange(false);
            }}
          >
            <div className="flex items-center gap-3 w-full">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-12 h-12 rounded-md object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No img</span>
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-medium">{recipe.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {(recipe.prep_time || recipe.cook_time) && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                    </span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recipe.servings}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Recipe</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="shared" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shared">Shared</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="mine">My Recipes</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[300px] mt-4">
            <TabsContent value="shared" className="mt-0">
              <RecipeList recipes={sharedRecipes} />
            </TabsContent>
            <TabsContent value="favorites" className="mt-0">
              <RecipeList recipes={favoriteRecipes} />
            </TabsContent>
            <TabsContent value="mine" className="mt-0">
              <RecipeList recipes={myRecipes} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
