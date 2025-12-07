import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Heart, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecipeCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: string;
  category?: string;
  isFavorite?: boolean;
  userId?: string;
  recipeOwnerId?: string;
  favoritesCount?: number;
  onDelete?: () => void;
}

export const RecipeCard = ({
  id,
  title,
  description,
  imageUrl,
  prepTime,
  cookTime,
  servings,
  difficulty,
  category,
  isFavorite: initialFavorite = false,
  userId,
  recipeOwnerId,
  favoritesCount = 0,
  onDelete,
}: RecipeCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const totalTime = (prepTime || 0) + (cookTime || 0);
  const isOwner = userId && recipeOwnerId === userId;

  // Sync with prop when it changes (e.g., after favorites are fetched)
  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Sign in to add to favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("recipe_id", id);

        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
        });
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, recipe_id: id });

        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
        });
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

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/edit-recipe/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Recipe deleted successfully" });
      onDelete?.();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast({ title: "Error", description: "Failed to delete recipe", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link to={`/recipe/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-medium group">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-background/90"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-destructive/90 hover:text-destructive-foreground"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {userId && recipeOwnerId !== userId && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background/90"
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
              </Button>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {category && <Badge variant="secondary">{category}</Badge>}
            {difficulty && (
              <Badge
                variant="outline"
                className={
                  difficulty === "easy"
                    ? "border-secondary text-secondary"
                    : difficulty === "medium"
                    ? "border-accent text-accent"
                    : "border-destructive text-destructive"
                }
              >
                {difficulty === "easy" ? "Easy" : difficulty === "medium" ? "Medium" : "Hard"}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-4 text-sm text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min</span>
            </div>
          )}
          {servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{servings} serv.</span>
            </div>
          )}
          {favoritesCount > 0 && (
            <div className="flex items-center gap-1 ml-auto text-primary">
              <Heart className="h-4 w-4 fill-primary" />
              <span>{favoritesCount}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};