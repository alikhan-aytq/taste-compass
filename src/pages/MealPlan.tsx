import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Pencil, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RecipePickerDialog } from "@/components/meal-plan/RecipePickerDialog";
import { Json } from "@/integrations/supabase/types";

interface MealRecipe {
  id: string;
  title: string;
  image_url: string | null;
}

interface DayMeals {
  breakfast?: MealRecipe;
  lunch?: MealRecipe;
  dinner?: MealRecipe;
}

type MealsData = Record<string, DayMeals>;

const MealPlan = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [meals, setMeals] = useState<MealsData>({});
  const [mealPlanId, setMealPlanId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dayKey: string; mealType: "breakfast" | "lunch" | "dinner" } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchMealPlan = useCallback(async () => {
    if (!user) return;

    const weekStart = format(currentWeek, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start_date", weekStart)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching meal plan:", error);
      return;
    }

    if (data) {
      setMealPlanId(data.id);
      setMeals((data.meals as MealsData) || {});
    } else {
      setMealPlanId(null);
      setMeals({});
    }
  }, [user, currentWeek]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [user, currentWeek, fetchMealPlan]);

  const saveMealPlan = async (newMeals: MealsData) => {
    if (!user) return;

    const weekStart = format(currentWeek, "yyyy-MM-dd");
    const mealsJson = newMeals as unknown as Json;

    try {
      if (mealPlanId) {
        const { error } = await supabase
          .from("meal_plans")
          .update({ meals: mealsJson })
          .eq("id", mealPlanId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("meal_plans")
          .insert([{
            user_id: user.id,
            week_start_date: weekStart,
            meals: mealsJson,
          }])
          .select()
          .single();

        if (error) throw error;
        setMealPlanId(data.id);
      }
    } catch (error) {
      console.error("Error saving meal plan:", error);
      toast({
        title: "Error",
        description: "Failed to save meal plan",
        variant: "destructive",
      });
    }
  };

  const handleAddMeal = (dayKey: string, mealType: "breakfast" | "lunch" | "dinner") => {
    setSelectedSlot({ dayKey, mealType });
    setPickerOpen(true);
  };

  const handleSelectRecipe = (recipe: { id: string; title: string; image_url: string | null }) => {
    if (!selectedSlot) return;

    const newMeals = { ...meals };
    if (!newMeals[selectedSlot.dayKey]) {
      newMeals[selectedSlot.dayKey] = {};
    }
    newMeals[selectedSlot.dayKey][selectedSlot.mealType] = {
      id: recipe.id,
      title: recipe.title,
      image_url: recipe.image_url,
    };

    setMeals(newMeals);
    saveMealPlan(newMeals);
    setSelectedSlot(null);
  };

  const handleRemoveMeal = (dayKey: string, mealType: "breakfast" | "lunch" | "dinner") => {
    const newMeals = { ...meals };
    if (newMeals[dayKey]) {
      delete newMeals[dayKey][mealType];
      if (Object.keys(newMeals[dayKey]).length === 0) {
        delete newMeals[dayKey];
      }
    }
    setMeals(newMeals);
    saveMealPlan(newMeals);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  const MealSlot = ({
    dayKey,
    mealType,
    label,
  }: {
    dayKey: string;
    mealType: "breakfast" | "lunch" | "dinner";
    label: string;
  }) => {
    const meal = meals[dayKey]?.[mealType];

    return (
      <div>
        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">{label}</h4>
        {meal ? (
          <div className="min-h-[80px] p-3 border rounded-lg bg-card relative group">
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleAddMeal(dayKey, mealType)}
                title="Change recipe"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => handleRemoveMeal(dayKey, mealType)}
                title="Remove recipe"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(`/recipe/${meal.id}`)}
            >
              {meal.image_url && (
                <img
                  src={meal.image_url}
                  alt={meal.title}
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <span className="text-sm font-medium line-clamp-2">{meal.title}</span>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="min-h-[80px] w-full border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary"
            onClick={() => handleAddMeal(dayKey, mealType)}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Add recipe</span>
          </Button>
        )}
      </div>
    );
  };

  if (authLoading) {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Weekly Meal Plan</h1>
          <p className="text-muted-foreground">Plan your meals in advance</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              {format(currentWeek, "MMMM d", { locale: enUS })} -{" "}
              {format(addDays(currentWeek, 6), "MMMM d, yyyy", { locale: enUS })}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          {weekDays.map((day, index) => {
            const dayKey = format(day, "yyyy-MM-dd");
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {format(day, "EEEE, MMMM d", { locale: enUS })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <MealSlot dayKey={dayKey} mealType="breakfast" label="Breakfast" />
                    <MealSlot dayKey={dayKey} mealType="lunch" label="Lunch" />
                    <MealSlot dayKey={dayKey} mealType="dinner" label="Dinner" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {user && (
        <RecipePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelectRecipe={handleSelectRecipe}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default MealPlan;
