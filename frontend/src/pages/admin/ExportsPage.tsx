import { useState } from 'react';
import { useExports, useExportTasks, useExportProjects } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader, Download, Trash2, FileJson, FileText, Sheet } from 'lucide-react';

export function ExportsPage() {
  const [exportType, setExportType] = useState<'tasks' | 'projects'>('tasks');
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const { data: exportsData, isLoading } = useExports();
  const exportTasks = useExportTasks();
  const exportProjects = useExportProjects();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportType === 'tasks') {
        await exportTasks.mutateAsync({ format });
      } else {
        await exportProjects.mutateAsync({ format });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const exports = exportsData?.items || [];
  const stats = {
    total: exportsData?.pagination?.total || 0,
    completed: exports.filter((e: any) => e.status === 'completed').length,
    processing: exports.filter((e: any) => e.status === 'processing').length,
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      case 'xlsx':
        return <Sheet className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Exports</h1>
        <p className="text-muted-foreground">Export data in multiple formats</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Exports</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Processing</div>
          <div className="text-3xl font-bold text-blue-600">{stats.processing}</div>
        </Card>
      </div>

      {/* Export Creator */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-4">Create New Export</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Type</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as 'tasks' | 'projects')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="tasks">Tasks</option>
                <option value="projects">Projects</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting || exportTasks.isPending || exportProjects.isPending}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </div>
      </Card>

      {/* Exports List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Exports</h2>
        {exports.map((exp: any) => (
          <Card key={exp.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getFormatIcon(exp.format)}
                  <div>
                    <h3 className="font-semibold">{exp.name}</h3>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground">{exp.description}</p>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <Badge variant={getStatusColor(exp.status)}>
                    {exp.status}
                  </Badge>
                  <span>Type: {exp.export_type}</span>
                  <span>Format: {exp.format.toUpperCase()}</span>
                  {exp.record_count !== null && (
                    <span>Records: {exp.record_count}</span>
                  )}
                  {exp.file_size && (
                    <span>Size: {(exp.file_size / 1024).toFixed(2)} KB</span>
                  )}
                  <span>Created: {new Date(exp.created_at).toLocaleString()}</span>
                </div>

                {/* Error Message */}
                {exp.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {exp.error_message}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {exp.status === 'completed' && exp.file_url && (
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {exports.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No exports yet</p>
          <p className="text-sm text-muted-foreground mt-2">Create your first export to get started</p>
        </Card>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Export Features</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Export tasks and projects in multiple formats</li>
          <li>✓ Support for CSV, JSON, XLSX, and PDF</li>
          <li>✓ Custom column selection</li>
          <li>✓ Advanced filtering options</li>
          <li>✓ Automatic expiration after 7 days</li>
          <li>✓ Track export history</li>
        </ul>
      </Card>
    </div>
  );
}
