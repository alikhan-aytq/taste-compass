import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";

const MealPlan = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [mealPlan, setMealPlan] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchMealPlan();
    }
  }, [user, currentWeek]);

  const fetchMealPlan = async () => {
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
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Меню на неделю</h1>
          <p className="text-muted-foreground">Планируйте питание заранее</p>
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
              {format(currentWeek, "d MMMM", { locale: ru })} -{" "}
              {format(addDays(currentWeek, 6), "d MMMM yyyy", { locale: ru })}
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
                  {format(day, "EEEE, d MMMM", { locale: ru })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Завтрак</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Не запланировано
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Обед</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Не запланировано
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Ужин</h4>
                    <div className="min-h-[80px] p-3 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
                      Не запланировано
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-6 bg-muted/30 rounded-lg text-center">
          <p className="text-muted-foreground mb-4">
            Функция планирования меню в разработке. Скоро вы сможете добавлять рецепты в меню!
          </p>
        </div>
      </main>
    </div>
  );
};

export default MealPlan;
