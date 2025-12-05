import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
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
}: RecipeCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const { toast } = useToast();
  const totalTime = (prepTime || 0) + (cookTime || 0);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы добавить в избранное",
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
          title: "Удалено из избранного",
        });
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, recipe_id: id });

        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Добавлено в избранное",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      });
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
              Нет изображения
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/80 hover:bg-background/90"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
          </Button>
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
                {difficulty === "easy" ? "Легко" : difficulty === "medium" ? "Средне" : "Сложно"}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex gap-4 text-sm text-muted-foreground">
          {totalTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{totalTime} мин</span>
            </div>
          )}
          {servings && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{servings} порц.</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
