import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

export default function Admin() {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    cuisine: '',
    difficulty: 'medium',
    prep_time: '',
    cook_time: '',
    servings: '',
    image_url: '',
  });

  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Необходима авторизация');
        return;
      }

      const filteredIngredients = ingredients.filter(i => i.trim() !== '');
      const filteredInstructions = instructions.filter(i => i.trim() !== '');

      if (filteredIngredients.length === 0 || filteredInstructions.length === 0) {
        toast.error('Добавьте хотя бы один ингредиент и шаг приготовления');
        return;
      }

      const { error } = await supabase.from('recipes').insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        cuisine: formData.cuisine,
        difficulty: formData.difficulty,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
        servings: formData.servings ? parseInt(formData.servings) : null,
        image_url: formData.image_url || null,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        user_id: user.id,
        is_public: true,
      });

      if (error) throw error;

      toast.success('Рецепт успешно добавлен');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        cuisine: '',
        difficulty: 'medium',
        prep_time: '',
        cook_time: '',
        servings: '',
        image_url: '',
      });
      setIngredients(['']);
      setInstructions(['']);
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Ошибка при создании рецепта');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Админ-панель</CardTitle>
            <CardDescription>Добавление публичных рецептов</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название рецепта *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Борщ украинский"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Краткое описание рецепта..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Супы"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuisine">Кухня</Label>
                  <Input
                    id="cuisine"
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    placeholder="Украинская"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Сложность</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Легко</SelectItem>
                    <SelectItem value="medium">Средне</SelectItem>
                    <SelectItem value="hard">Сложно</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep_time">Подготовка (мин)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.prep_time}
                    onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cook_time">Готовка (мин)</Label>
                  <Input
                    id="cook_time"
                    type="number"
                    value={formData.cook_time}
                    onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                    placeholder="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servings">Порций</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL изображения</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Ингредиенты *</Label>
                  <Button type="button" onClick={handleAddIngredient} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      placeholder="Например: 300г муки"
                    />
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Инструкции *</Label>
                  <Button type="button" onClick={handleAddInstruction} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить
                  </Button>
                </div>
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      placeholder={`Шаг ${index + 1}`}
                      rows={2}
                    />
                    {instructions.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => handleRemoveInstruction(index)}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать рецепт
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
