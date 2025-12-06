import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { enUS } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";

interface MealPlanData {
  id: string;
  user_id: string;
  week_start_date: string;
  meals: Json;
}

const MealPlan = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [mealPlan, setMealPlan] = useState<MealPlanData | { meals: Record<string, unknown> } | null>(null);
  const navigate = useNavigate();

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

    setMealPlan(data || { meals: {} });
  }, [user, currentWeek]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [user, currentWeek, fetchMealPlan]);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

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
          {weekDays.map((day, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(day, "EEEE, MMMM d", { locale: enUS })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Breakfast</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Not planned
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Lunch</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Not planned
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Dinner</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Not planned
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted/30 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Meal planning feature is under development. Soon you will be able to add recipes to your menu!
          </p>
        </div>
      </main>
    </div>
  );
};

export default MealPlan;
