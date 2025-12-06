import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

const ShoppingList = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [listId, setListId] = useState<string | null>(null);
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
      fetchShoppingList();
    }
  }, [user]);

  const fetchShoppingList = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching shopping list:", error);
      return;
    }

    if (data) {
      setListId(data.id);
      const parsedItems = Array.isArray(data.items) ? data.items as unknown as ShoppingItem[] : [];
      setItems(parsedItems);
    } else {
      createNewList();
    }
  };

  const createNewList = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id, items: [] })
      .select()
      .single();

    if (error) {
      console.error("Error creating shopping list:", error);
      return;
    }

    setListId(data.id);
  };

  const saveList = async (updatedItems: ShoppingItem[]) => {
    if (!listId) return;

    const { error } = await supabase
      .from("shopping_lists")
      .update({ items: updatedItems as any })
      .eq("id", listId);

    if (error) {
      console.error("Error saving shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to save list",
        variant: "destructive",
      });
    }
  };

  const addItem = () => {
    if (!newItem.trim()) return;

    const newItems = [
      ...items,
      {
        id: crypto.randomUUID(),
        name: newItem,
        checked: false,
      },
    ];

    setItems(newItems);
    saveList(newItems);
    setNewItem("");
  };

  const toggleItem = (id: string) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);
    saveList(newItems);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter((item) => item.id !== id);
    setItems(newItems);
    saveList(newItems);
  };

  const clearChecked = () => {
    const newItems = items.filter((item) => !item.checked);
    setItems(newItems);
    saveList(newItems);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <main className="container py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shopping List</h1>
          <p className="text-muted-foreground">Manage your shopping</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addItem()}
              />
              <Button onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                List is empty. Add your first item!
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <span
                        className={`flex-1 ${
                          item.checked ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
                {items.some((item) => item.checked) && (
                  <Button
                    variant="outline"
                    onClick={clearChecked}
                    className="w-full"
                  >
                    Remove Checked
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ShoppingList;