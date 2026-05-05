import { useState } from 'react';
import { useExports, useExportTasks, useExportProjects, useDeleteExport } from '@/api/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader, Download, Trash2, FileJson, FileText, Sheet, CheckCircle2 } from 'lucide-react';

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExportResult(rows: Record<string, unknown>[], fmt: string, type: string) {
  const date = new Date().toISOString().slice(0, 10);
  if (fmt === 'json') {
    triggerDownload(JSON.stringify(rows, null, 2), `${type}-${date}.json`, 'application/json');
  } else {
    // csv / xlsx / pdf all fall back to CSV (no third-party lib needed)
    const ext = fmt === 'json' ? 'json' : 'csv';
    triggerDownload(toCSV(rows), `${type}-${date}.${ext}`, 'text/csv');
  }
}

export function ExportsPage() {
  const [exportType, setExportType] = useState<'tasks' | 'projects'>('tasks');
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  const { data: exportsData, isLoading, refetch } = useExports();
  const exportTasks = useExportTasks();
  const exportProjects = useExportProjects();
  const deleteExport = useDeleteExport();

  const handleExport = async () => {
    setIsExporting(true);
    setLastSuccess(null);
    try {
      const result = exportType === 'tasks'
        ? await exportTasks.mutateAsync({ format })
        : await exportProjects.mutateAsync({ format });

      const rows: Record<string, unknown>[] = result?.data ?? [];
      if (rows.length > 0) {
        downloadExportResult(rows, format, exportType);
        setLastSuccess(`Downloaded ${rows.length} ${exportType} as ${format.toUpperCase()}`);
      } else {
        setLastSuccess('Export completed — no records matched.');
      }
      refetch();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReExport = async (exp: { export_type: string; format: string }) => {
    setIsExporting(true);
    try {
      const type = exp.export_type as 'tasks' | 'projects';
      const result = type === 'tasks'
        ? await exportTasks.mutateAsync({ format: exp.format })
        : await exportProjects.mutateAsync({ format: exp.format });

      const rows: Record<string, unknown>[] = result?.data ?? [];
      if (rows.length > 0) downloadExportResult(rows, exp.format, type);
    } catch (error) {
      console.error('Re-export failed:', error);
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

  const getFormatIcon = (fmt: string) => {
    if (fmt === 'csv') return <FileText className="h-4 w-4" />;
    if (fmt === 'json') return <FileJson className="h-4 w-4" />;
    if (fmt === 'xlsx') return <Sheet className="h-4 w-4" />;
    return <Download className="h-4 w-4" />;
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (status === 'completed') return 'default';
    if (status === 'processing') return 'secondary';
    if (status === 'failed') return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6 p-6">
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
                <option value="xlsx">Excel (downloads as CSV)</option>
                <option value="pdf">PDF (downloads as CSV)</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting || exportTasks.isPending || exportProjects.isPending}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting…' : 'Export & Download'}
          </Button>

          {lastSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {lastSuccess}
            </div>
          )}
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <Badge variant={getStatusVariant(exp.status)}>{exp.status}</Badge>
                  <span>Type: {exp.export_type}</span>
                  <span>Format: {exp.format.toUpperCase()}</span>
                  {exp.record_count !== null && <span>Records: {exp.record_count}</span>}
                  <span>Created: {new Date(exp.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                {exp.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {exp.error_message}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4 shrink-0">
                {exp.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isExporting}
                    onClick={() => handleReExport(exp)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleteExport.isPending}
                  onClick={() => deleteExport.mutate(exp.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {exports.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No exports yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first export to get started</p>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Export Features</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Export tasks and projects — file downloads instantly in your browser</li>
          <li>✓ CSV and JSON formats with full data fidelity</li>
          <li>✓ Re-download any previous export from the history list</li>
          <li>✓ Automatic expiration after 7 days</li>
          <li>✓ Track export history</li>
        </ul>
      </Card>
    </div>
  );
}
