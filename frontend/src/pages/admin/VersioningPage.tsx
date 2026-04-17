import { useState } from 'react';
import { useSnapshots, useCreateSnapshot } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader, Plus, Download, Trash2, Clock } from 'lucide-react';

export function VersioningPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    snapshotType: 'full',
  });

  const { data: snapshotsData, isLoading } = useSnapshots();
  const createSnapshot = useCreateSnapshot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Gather current state data
      await createSnapshot.mutateAsync({
        ...formData,
        data: {
          timestamp: new Date().toISOString(),
          // Add actual data here
        },
      });
      setFormData({ name: '', description: '', snapshotType: 'full' });
      setShowForm(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const snapshots = snapshotsData?.items || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Versioning & Snapshots</h1>
          <p className="text-muted-foreground">Point-in-time backups and version history</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Snapshot
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Snapshots</div>
          <div className="text-3xl font-bold">{snapshots.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Full Backups</div>
          <div className="text-3xl font-bold">
            {snapshots.filter((s) => s.snapshot_type === 'full').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Incremental</div>
          <div className="text-3xl font-bold">
            {snapshots.filter((s) => s.snapshot_type === 'incremental').length}
          </div>
        </Card>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-4">Create Snapshot</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Snapshot Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
            <select
              value={formData.snapshotType}
              onChange={(e) => setFormData({ ...formData, snapshotType: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="full">Full Backup</option>
              <option value="incremental">Incremental</option>
            </select>
            <div className="flex gap-2">
              <Button type="submit" disabled={createSnapshot.isPending}>
                Create Snapshot
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ name: '', description: '', snapshotType: 'full' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Snapshots List */}
      <div className="space-y-3">
        {snapshots.map((snapshot) => (
          <Card key={snapshot.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{snapshot.name}</h3>
                  <Badge variant={snapshot.snapshot_type === 'full' ? 'default' : 'secondary'}>
                    {snapshot.snapshot_type === 'full' ? 'Full Backup' : 'Incremental'}
                  </Badge>
                </div>
                {snapshot.description && (
                  <p className="text-sm text-muted-foreground mb-2">{snapshot.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Created: {new Date(snapshot.created_at).toLocaleString()}</span>
                  <span>Size: {Math.round(JSON.stringify(snapshot.data).length / 1024)} KB</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Restore
                </Button>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {snapshots.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No snapshots created yet</p>
          <p className="text-sm text-muted-foreground mt-2">Create your first snapshot to get started</p>
        </Card>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">About Versioning</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ All changes are automatically tracked with version history</li>
          <li>✓ View who made changes and when</li>
          <li>✓ Compare different versions side-by-side</li>
          <li>✓ Restore to any previous version</li>
          <li>✓ Create snapshots for point-in-time backups</li>
        </ul>
      </Card>
    </div>
  );
}
