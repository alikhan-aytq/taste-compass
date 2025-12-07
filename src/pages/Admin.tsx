import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Database, PlusCircle, Search, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Recipe {
  id: string;
  title: string;
  category: string | null;
  cuisine: string | null;
  difficulty: string | null;
  created_at: string;
  is_public: boolean | null;
}

export default function Admin() {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  
  const activeTab = searchParams.get('tab') || 'database';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

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

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchRecipes();
    }
  }, [loading, isAdmin]);

  const fetchRecipes = async () => {
    try {
      setRecipesLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, category, cuisine, difficulty, created_at, is_public')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setRecipesLoading(false);
    }
  };

  const handleDeleteRecipe = async (id: string) => {
    try {
      setDeletingId(id);
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Recipe deleted successfully');
      setRecipes(recipes.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditRecipe = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setEditingRecipe(id);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        cuisine: data.cuisine || '',
        difficulty: data.difficulty || 'medium',
        prep_time: data.prep_time?.toString() || '',
        cook_time: data.cook_time?.toString() || '',
        servings: data.servings?.toString() || '',
        image_url: data.image_url || '',
      });
      setIngredients(Array.isArray(data.ingredients) ? data.ingredients as string[] : ['']);
      setInstructions(Array.isArray(data.instructions) ? data.instructions as string[] : ['']);
      setSearchParams({ tab: 'add' });
    } catch (error) {
      console.error('Error loading recipe:', error);
      toast.error('Failed to load recipe for editing');
    }
  };

  const resetForm = () => {
    setEditingRecipe(null);
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
  };

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
        toast.error('Authentication required');
        return;
      }

      const filteredIngredients = ingredients.filter(i => i.trim() !== '');
      const filteredInstructions = instructions.filter(i => i.trim() !== '');

      if (filteredIngredients.length === 0 || filteredInstructions.length === 0) {
        toast.error('Add at least one ingredient and one cooking step');
        return;
      }

      if (editingRecipe) {
        const { error } = await supabase.from('recipes').update({
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
        }).eq('id', editingRecipe);

        if (error) throw error;
        toast.success('Recipe updated successfully');
      } else {
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
        toast.success('Recipe added successfully');
      }
      
      resetForm();
      
      // Refresh recipes list
      fetchRecipes();
    } catch (error) {
      console.error('Error creating recipe:', error);
      toast.error('Error creating recipe');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage recipes database</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="database" className="flex items-center gap-2" onClick={() => resetForm()}>
              <Database className="h-4 w-4" />
              Recipes Database
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2" onClick={() => !editingRecipe && resetForm()}>
              <PlusCircle className="h-4 w-4" />
              {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>All Recipes</CardTitle>
                <CardDescription>View and manage all recipes in the database</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {recipesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredRecipes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {searchQuery ? 'No recipes found matching your search' : 'No recipes in database'}
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead className="hidden md:table-cell">Category</TableHead>
                          <TableHead className="hidden md:table-cell">Cuisine</TableHead>
                          <TableHead className="hidden sm:table-cell">Difficulty</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecipes.map((recipe) => (
                          <TableRow key={recipe.id}>
                            <TableCell className="font-medium">{recipe.title}</TableCell>
                            <TableCell className="hidden md:table-cell">{recipe.category || '-'}</TableCell>
                            <TableCell className="hidden md:table-cell">{recipe.cuisine || '-'}</TableCell>
                            <TableCell className="hidden sm:table-cell capitalize">{recipe.difficulty || '-'}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {new Date(recipe.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditRecipe(recipe.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      disabled={deletingId === recipe.id}
                                    >
                                      {deletingId === recipe.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteRecipe(recipe.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</CardTitle>
                    <CardDescription>{editingRecipe ? 'Update the recipe details' : 'Create a new public recipe'}</CardDescription>
                  </div>
                  {editingRecipe && (
                    <Button variant="outline" onClick={resetForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Recipe Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Chicken Parmesan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the recipe..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Soups"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cuisine">Cuisine</Label>
                      <Input
                        id="cuisine"
                        value={formData.cuisine}
                        onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                        placeholder="Italian"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prep_time">Prep Time (min)</Label>
                      <Input
                        id="prep_time"
                        type="number"
                        value={formData.prep_time}
                        onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                        placeholder="30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cook_time">Cook Time (min)</Label>
                      <Input
                        id="cook_time"
                        type="number"
                        value={formData.cook_time}
                        onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                        placeholder="60"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="servings">Servings</Label>
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
                    <Label htmlFor="image_url">Image URL</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Ingredients *</Label>
                      <Button type="button" onClick={handleAddIngredient} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={ingredient}
                          onChange={(e) => handleIngredientChange(index, e.target.value)}
                          placeholder="E.g.: 300g flour"
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
                      <Label>Instructions *</Label>
                      <Button type="button" onClick={handleAddInstruction} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    {instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <Textarea
                          value={instruction}
                          onChange={(e) => handleInstructionChange(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
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
                    {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}