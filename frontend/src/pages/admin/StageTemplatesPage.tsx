import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X,
  Layers, GripVertical, Save, Building2, ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  useStageTemplates, useCreateStageTemplate, useUpdateStageTemplate, useDeleteStageTemplate,
  useCreateSubstage, useUpdateSubstage, useDeleteSubstage, useBulkReplaceSubstages,
} from '@/api/hooks';
import { useDivisions } from '@/api/hooks';
import type { StageTemplate, SubstageTemplate } from '@/types';

// ── Substage row ──────────────────────────────────────────

function SubstageRow({
  sub, stageId, isAdmin, onDelete,
}: { sub: SubstageTemplate; stageId: string; isAdmin: boolean; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);
  const updateSub = useUpdateSubstage();

  const save = async () => {
    if (!name.trim() || name.trim() === sub.name) { setEditing(false); return; }
    await updateSub.mutateAsync({ stageId, substageId: sub.id, name: name.trim() });
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-1.5 pl-3 pr-2 rounded-lg hover:bg-muted/30 group">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            className="h-7 text-xs flex-1"
            autoFocus
          />
          <button onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm flex-1 capitalize-first">{sub.name}</span>
          {isAdmin && (
            <div className="hidden group-hover:flex items-center gap-0.5">
              <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <Edit2 className="h-3 w-3" />
              </button>
              <button onClick={onDelete} className="p-1 rounded hover:bg-red-50 text-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Add substage inline ───────────────────────────────────

function AddSubstageRow({ stageId, onAdded }: { stageId: string; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const createSub = useCreateSubstage();

  const save = async () => {
    if (!name.trim()) return;
    await createSub.mutateAsync({ stageId, name: name.trim() });
    setName('');
    onAdded?.();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 pl-4 py-1"
      >
        <Plus className="h-3.5 w-3.5" /> Add substage
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 pl-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false); }}
        placeholder="Substage name..."
        className="h-7 text-xs flex-1"
        autoFocus
      />
      <button onClick={save} disabled={createSub.isPending} className="p-1 text-green-600 hover:bg-green-50 rounded">
        <Check className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => { setOpen(false); setName(''); }} className="p-1 text-muted-foreground hover:bg-muted rounded">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Stage card ────────────────────────────────────────────

function StageCard({ stage, isAdmin }: { stage: StageTemplate; isAdmin: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(stage.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateStage = useUpdateStageTemplate();
  const deleteStage = useDeleteStageTemplate();
  const deleteSub = useDeleteSubstage();

  const saveName = async () => {
    if (!name.trim() || name.trim() === stage.name) { setEditingName(false); return; }
    await updateStage.mutateAsync({ id: stage.id, name: name.trim() });
    setEditingName(false);
  };

  const toggleActive = () => updateStage.mutate({ id: stage.id, is_active: !stage.is_active });

  return (
    <Card className={cn('transition-all', !stage.is_active && 'opacity-60')}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
          >
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            {editingName ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                className="h-7 text-sm font-semibold flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="font-semibold text-sm truncate">{stage.name}</span>
            )}
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px]">
              {stage.substages.length} substage{stage.substages.length !== 1 ? 's' : ''}
            </Badge>
            {!stage.is_active && (
              <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
            )}
            {isAdmin && (
              <>
                {editingName ? (
                  <>
                    <button onClick={saveName} className="p-1 text-green-600 hover:bg-green-50 rounded">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingName(false)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditingName(true)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={toggleActive}
                  title={stage.is_active ? 'Deactivate' : 'Activate'}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                >
                  {stage.is_active ? <ChevronUp className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5 text-green-600" />}
                </button>
                {confirmDelete ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteStage.mutate(stage.id)}
                      className="text-xs text-red-600 font-medium px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100"
                    >
                      Confirm
                    </button>
                    <button onClick={() => setConfirmDelete(false)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="p-1 rounded hover:bg-red-50 text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-3 space-y-0.5">
          {stage.substages.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 pl-4">No substages yet</p>
          )}
          {stage.substages.map((sub) => (
            <SubstageRow
              key={sub.id}
              sub={sub}
              stageId={stage.id}
              isAdmin={isAdmin}
              onDelete={() => deleteSub.mutate({ stageId: stage.id, substageId: sub.id })}
            />
          ))}
          {isAdmin && <AddSubstageRow stageId={stage.id} />}
        </CardContent>
      )}
    </Card>
  );
}

// ── Add stage form ────────────────────────────────────────

function AddStageForm({ divisionId, divisions, onClose }: {
  divisionId?: string;
  divisions: Array<{ id: string; name: string }>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [selectedDiv, setSelectedDiv] = useState(divisionId || '');
  const createStage = useCreateStageTemplate();

  const save = async () => {
    if (!name.trim()) return;
    await createStage.mutateAsync({ name: name.trim(), division_id: selectedDiv || null });
    onClose();
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-4 pb-4 space-y-3">
        <h4 className="text-sm font-semibold">New Stage</h4>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose(); }}
          placeholder="Stage name (e.g. CHANGE REQUEST)"
          className="text-sm uppercase"
          autoFocus
        />
        <div>
          <label className="text-xs text-muted-foreground">Division (optional)</label>
          <select
            value={selectedDiv}
            onChange={(e) => setSelectedDiv(e.target.value)}
            className="mt-1 w-full px-3 py-1.5 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— All Divisions (Global) —</option>
            {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={!name.trim() || createStage.isPending}>
            <Save className="h-3.5 w-3.5 mr-1" /> Create Stage
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────

export function StageTemplatesPage() {
  const { currentRole } = useAuthStore();
  const isAdmin = currentRole === 'org_admin' || currentRole === 'division_admin';

  const [filterDivId, setFilterDivId] = useState('');
  const [showAddStage, setShowAddStage] = useState(false);

  const { data: stages = [], isLoading } = useStageTemplates(filterDivId ? { division_id: filterDivId } : undefined);
  const divisionsQ = useDivisions();
  const allDivisions = (divisionsQ.data?.items ?? divisionsQ.data ?? []) as Array<{ id: string; name: string }>;

  // Group stages by division
  const grouped = stages.reduce<Record<string, StageTemplate[]>>((acc, s) => {
    const key = s.division_id ?? '__global__';
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const divisionName = (id: string) => {
    if (id === '__global__') return 'Global (All Divisions)';
    return allDivisions.find((d) => d.id === id)?.name ?? id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Stage Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define project stages and substages per division. Substages auto-populate as milestones when a project is created.
          </p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowAddStage(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Stage
          </Button>
        )}
      </div>

      {/* Division filter */}
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterDivId}
          onChange={(e) => setFilterDivId(e.target.value)}
          className="px-3 py-1.5 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Divisions</option>
          {allDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {filterDivId && (
          <button onClick={() => setFilterDivId('')} className="text-xs text-muted-foreground hover:text-foreground">
            Clear filter
          </button>
        )}
      </div>

      {/* Add Stage form */}
      {showAddStage && (
        <AddStageForm
          divisionId={filterDivId}
          divisions={allDivisions}
          onClose={() => setShowAddStage(false)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Stages grouped by division */}
      {!isLoading && stages.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No stage templates yet</p>
          {isAdmin && (
            <p className="text-xs mt-1">Click "Add Stage" to create your first stage template.</p>
          )}
        </div>
      )}

      {!isLoading && Object.entries(grouped).map(([divId, divStages]) => (
        <div key={divId} className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {divisionName(divId)}
            </h3>
            <span className="text-xs text-muted-foreground">({divStages.length} stages)</span>
          </div>
          {divStages.map((stage) => (
            <StageCard key={stage.id} stage={stage} isAdmin={isAdmin} />
          ))}
        </div>
      ))}
    </div>
  );
}
