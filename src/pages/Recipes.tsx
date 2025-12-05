import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

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

const Recipes = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
      return;
    }

    setRecipes(data || []);
  };

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select("recipe_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching favorites:", error);
      return;
    }

    setFavorites(new Set(data.map((f) => f.recipe_id)));
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || recipe.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === "all" || recipe.difficulty === difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Все рецепты</h1>
          <p className="text-muted-foreground">Найдите идеальный рецепт для любого случая</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Поиск рецептов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="Завтрак">Завтрак</SelectItem>
              <SelectItem value="Обед">Обед</SelectItem>
              <SelectItem value="Ужин">Ужин</SelectItem>
              <SelectItem value="Десерт">Десерт</SelectItem>
              <SelectItem value="Закуски">Закуски</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Сложность" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Любая</SelectItem>
              <SelectItem value="easy">Легко</SelectItem>
              <SelectItem value="medium">Средне</SelectItem>
              <SelectItem value="hard">Сложно</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Рецептов не найдено</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description || undefined}
                imageUrl={recipe.image_url || undefined}
                prepTime={recipe.prep_time || undefined}
                cookTime={recipe.cook_time || undefined}
                servings={recipe.servings || undefined}
                difficulty={recipe.difficulty || undefined}
                category={recipe.category || undefined}
                isFavorite={favorites.has(recipe.id)}
                userId={user?.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recipes;
