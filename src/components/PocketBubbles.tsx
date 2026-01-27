'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useRef } from 'react';
import { createPocket, renamePocket, deletePocket } from '@/app/actions/pockets';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { SharePocketDialog } from '@/components/SharePocketDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';

interface Pocket {
  id: string;
  name: string;
}

interface PocketBubblesProps {
  pockets: Pocket[];
  totalSpend: number; // Maybe optional to show total per pocket if we want later, unused for now.
  readonly?: boolean;
}

export function PocketBubbles({ pockets, readonly = false }: PocketBubblesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPocketId = searchParams.get('pocketId') || 'all';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [pocketToEdit, setPocketToEdit] = useState<Pocket | null>(null);
  const [pocketToShare, setPocketToShare] = useState<Pocket | null>(null);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') {
      params.delete('pocketId');
    } else {
      params.set('pocketId', id);
    }
    router.push(`?${params.toString()}`);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setIsLoading(true);
    const result = await createPocket(newName);
    setIsLoading(false);
    if (result.success) {
      toast.success('Pocket created successfully');
      setNewName('');
      setIsCreateOpen(false);
      // Select the new pocket?
      if (result.data) handleSelect(result.data.id);
    } else {
      toast.error('Failed to create pocket');
    }
  }

  async function handleRename() {
    if (!pocketToEdit || !newName.trim()) return;
    setIsLoading(true);
    const result = await renamePocket(pocketToEdit.id, newName);
    setIsLoading(false);
    if (result.success) {
      toast.success('Pocket renamed');
      setNewName('');
      setIsEditOpen(false);
      setPocketToEdit(null);
    } else {
      toast.error('Failed to rename pocket');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this pocket? Related invoices may be affected.')) return;

    setIsLoading(true);
    const result = await deletePocket(id);
    setIsLoading(false);
    if (result.success) {
      toast.success('Pocket deleted');
      if (currentPocketId === id) handleSelect('all');
    } else {
      toast.error('Failed to delete pocket');
    }
  }

  const openEdit = (pocket: Pocket) => {
    setPocketToEdit(pocket);
    setNewName(pocket.name);
    setIsEditOpen(true);
  };

  const openShare = (pocket: Pocket) => {
    setPocketToShare(pocket);
    setIsShareOpen(true);
  };

  return (
    <div className="w-full overflow-x-auto pb-2 no-scrollbar" ref={scrollContainerRef}>
      <div className="flex space-x-2">
        {/* All Pockets Bubble */}
        <Button
          variant={currentPocketId === 'all' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            "rounded-full h-8 px-4 text-xs shadow-subtle transition-all",
            currentPocketId === 'all'
              ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
              : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
          )}
          onClick={() => handleSelect('all')}
        >
          All
        </Button>

        {pockets.map((pocket) => (
          <div key={pocket.id} className="relative group">
            <Button
              variant={currentPocketId === pocket.id ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "rounded-full h-8 px-4 text-xs shadow-subtle transition-all",
                !readonly && "pr-8",
                currentPocketId === pocket.id
                  ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
                  : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
              )}
              onClick={() => handleSelect(pocket.id)}
            >
              {pocket.name}
            </Button>

            {/* Context Menu Trigger */}
            {!readonly && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-zinc-200/50 p-0">
                      <MoreHorizontal className="h-3 w-3 text-zinc-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl border-zinc-200">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openShare(pocket); }} className="text-zinc-700">
                      <Users className="mr-2 h-3 w-3" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(pocket); }} className="text-zinc-700">
                      <Pencil className="mr-2 h-3 w-3" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(pocket.id); }} className="text-red-600 focus:text-red-600">
                      <Trash2 className="mr-2 h-3 w-3" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}

        {/* Create New Button */}
        {!readonly && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8 border-dashed border-2 border-zinc-300 shrink-0 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Create New Pocket</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-zinc-700">Name</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g., Vacation"
              className="mt-2 rounded-xl border-zinc-200 focus:border-zinc-400"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isLoading} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Rename Pocket</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-zinc-700">Name</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Pocket Name"
              className="mt-2 rounded-xl border-zinc-200 focus:border-zinc-400"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRename} disabled={isLoading} className="rounded-xl bg-zinc-900 hover:bg-zinc-800">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {pocketToShare && (
        <SharePocketDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          pocketId={pocketToShare.id}
          pocketName={pocketToShare.name}
        />
      )}

    </div>
  );
}
