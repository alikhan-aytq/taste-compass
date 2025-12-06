import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Loader2, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useCallback } from 'react';

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  difficulty: string | null;
  cuisine: string | null;
}

interface FavoriteWithRecipe {
  recipe_id: string;
  recipes: Recipe | null;
}

const Favorites = () => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchFavorites = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          recipe_id,
          recipes (
            id,
            title,
            description,
            image_url,
            prep_time,
            cook_time,
            difficulty,
            cuisine
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const recipesData = (data as unknown as FavoriteWithRecipe[])
        ?.map((fav) => fav.recipes)
        .filter((recipe): recipe is Recipe => recipe !== null);

      setFavorites(recipesData || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load favorites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      fetchFavorites(user.id);
    };
    getUser();
  }, [navigate, fetchFavorites]);

  if (loading) {
    return (
      <>
        <Header user={user} />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-3xl font-bold">Favorites</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-2">No favorite recipes yet</p>
            <p className="text-muted-foreground">Add recipes to favorites to quickly find them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description || undefined}
                imageUrl={recipe.image_url || undefined}
                prepTime={recipe.prep_time || undefined}
                cookTime={recipe.cook_time || undefined}
                difficulty={recipe.difficulty || undefined}
                userId={user?.id}
                isFavorite={true}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export default Favorites;