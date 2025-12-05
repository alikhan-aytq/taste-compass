import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { Search, ChefHat, Clock, Heart, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import heroImage from "@/assets/hero-cooking.jpg";

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [featuredRecipes, setFeaturedRecipes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

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
                Откройте мир <span className="bg-gradient-warm bg-clip-text text-transparent">вкусных рецептов</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Более 1000 проверенных рецептов для каждого случая. Создавайте меню, управляйте покупками и готовьте с удовольствием.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Найти рецепт..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-12"
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="h-12">
                  Искать
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
            <h3 className="text-xl font-semibold">Умный поиск</h3>
            <p className="text-muted-foreground">
              Найдите рецепт по ингредиентам, категории или сложности
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold">Таймер готовки</h3>
            <p className="text-muted-foreground">
              Встроенный таймер поможет не упустить важный момент
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Меню на неделю</h3>
            <p className="text-muted-foreground">
              Планируйте питание заранее и экономьте время
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Избранное</h3>
            <p className="text-muted-foreground">
              Сохраняйте любимые рецепты и делитесь ими
            </p>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featuredRecipes.length > 0 && (
        <section className="container py-16 md:py-24 bg-muted/30">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Популярные рецепты</h2>
              <p className="text-muted-foreground">Рецепты, которые любят наши пользователи</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/recipes">Смотреть все</Link>
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
              Начните готовить вместе с нами
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Создайте аккаунт и получите доступ ко всем функциям
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Присоединиться бесплатно</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
