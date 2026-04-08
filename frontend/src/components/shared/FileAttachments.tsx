import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, File, Trash2, Download, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface FileAttachmentsProps {
  attachments: Attachment[];
  onUpload?: (files: File[]) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  png: Image,
  jpg: Image,
  jpeg: Image,
  gif: Image,
  svg: Image,
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return fileIcons[ext] || File;
}

const mockAttachments: Attachment[] = [
  { id: 'a1', name: 'navigation-wireframe-v2.png', size: 284000, type: 'image/png', url: '#', uploaded_by: 'Carol Johnson', uploaded_at: '2026-02-10T10:30:00Z' },
  { id: 'a2', name: 'auth-flow-diagram.pdf', size: 1520000, type: 'application/pdf', url: '#', uploaded_by: 'Bob Martinez', uploaded_at: '2026-02-08T14:00:00Z' },
  { id: 'a3', name: 'component-spec.docx', size: 89000, type: 'application/docx', url: '#', uploaded_by: 'Alice Chen', uploaded_at: '2026-02-05T09:15:00Z' },
];

export function FileAttachments({ attachments: propAttachments, onUpload, onDelete, readOnly = false }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState(propAttachments.length > 0 ? propAttachments : mockAttachments);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFiles = (files: File[]) => {
    const newAttachments: Attachment[] = files.map((f) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
      uploaded_by: 'You',
      uploaded_at: new Date().toISOString(),
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    onUpload?.(files);
  };

  const handleDelete = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    onDelete?.(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments ({attachments.length})
        </h4>
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />

      {/* Drop Zone */}
      {!readOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          <Upload className={cn('h-8 w-8 mb-2', dragging ? 'text-primary' : 'text-muted-foreground/40')} />
          <p className="text-sm text-muted-foreground">
            {dragging ? 'Drop files here' : 'Drag & drop files or click to upload'}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">Max 25MB per file. Images, PDFs, documents.</p>
        </div>
      )}

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.name);
            const isImage = att.type.startsWith('image/');
            return (
              <div key={att.id} className="group flex items-center gap-3 rounded-lg border p-2.5 hover:bg-accent/50 transition-colors">
                {/* Preview / Icon */}
                {isImage ? (
                  <div className="h-10 w-10 rounded-md bg-secondary overflow-hidden shrink-0">
                    <img src={att.url} alt={att.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(att.size)}</span>
                    <span>•</span>
                    <span>{att.uploaded_by}</span>
                    <span>•</span>
                    <span>{new Date(att.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={att.url} download={att.name} className="p-1.5 rounded hover:bg-accent" onClick={(e) => e.stopPropagation()}>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                  {!readOnly && (
                    <button onClick={() => handleDelete(att.id)} className="p-1.5 rounded hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
