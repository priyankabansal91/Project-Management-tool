import { useState } from 'react';
import { useDivisionHierarchy, useCreateDivision, useUpdateDivision, useDeleteDivision } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader, Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';

export function DivisionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    head_count: '',
  });

  const { data: hierarchy, isLoading } = useDivisionHierarchy();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDivision.mutateAsync({ divisionId: editingId, ...formData });
      } else {
        await createDivision.mutateAsync(formData);
      }
      setFormData({ name: '', code: '', description: '', budget: '', head_count: '' });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (divisionId: string) => {
    if (confirm('Are you sure you want to delete this division?')) {
      try {
        await deleteDivision.mutateAsync(divisionId);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const renderDivisionTree = (divisions: any[]) => {
    return (
      <div className="space-y-2">
        {divisions.map((division) => (
          <div key={division.id} className="ml-4">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{division.name}</h3>
                    <Badge variant="outline">{division.code}</Badge>
                    {division.budget && (
                      <Badge variant="secondary">${division.budget}</Badge>
                    )}
                  </div>
                  {division.description && (
                    <p className="text-sm text-muted-foreground mt-1">{division.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {division.member_count !== undefined && (
                      <span>👥 {division.member_count} members</span>
                    )}
                    {division.project_count !== undefined && (
                      <span>📁 {division.project_count} projects</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(division.id);
                      setFormData({
                        name: division.name,
                        code: division.code,
                        description: division.description || '',
                        budget: division.budget || '',
                        head_count: division.head_count || '',
                      });
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(division.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
            {division.children && division.children.length > 0 && (
              <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-4">
                {renderDivisionTree(division.children)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Divisions</h1>
          <p className="text-muted-foreground">Manage organizational divisions and hierarchy</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Division
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Division' : 'Create Division'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Division Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                placeholder="Code (e.g., ENG, HR)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
              <Input
                placeholder="Head Count"
                type="number"
                value={formData.head_count}
                onChange={(e) => setFormData({ ...formData, head_count: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createDivision.isPending || updateDivision.isPending}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', code: '', description: '', budget: '', head_count: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Divisions Tree */}
      {hierarchy && hierarchy.length > 0 ? (
        <div>{renderDivisionTree(hierarchy)}</div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No divisions created yet</p>
          <p className="text-sm text-muted-foreground mt-2">Create your first division to get started</p>
        </Card>
      )}
    </div>
  );
}
