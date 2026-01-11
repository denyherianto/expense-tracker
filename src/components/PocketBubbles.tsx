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
      toast.success('Pocket berhasil dibuat');
      setNewName('');
      setIsCreateOpen(false);
      // Select the new pocket?
      if (result.data) handleSelect(result.data.id);
    } else {
      toast.error('Gagal membuat pocket');
    }
  }

  async function handleRename() {
    if (!pocketToEdit || !newName.trim()) return;
    setIsLoading(true);
    const result = await renamePocket(pocketToEdit.id, newName);
    setIsLoading(false);
    if (result.success) {
      toast.success('Nama pocket diubah');
      setNewName('');
      setIsEditOpen(false);
      setPocketToEdit(null);
    } else {
      toast.error('Gagal mengubah nama pocket');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Anda yakin ingin menghapus pocket ini? Faktur yang terkait mungkin akan terpengaruh.')) return;

    setIsLoading(true);
    const result = await deletePocket(id);
    setIsLoading(false);
    if (result.success) {
      toast.success('Pocket dihapus');
      if (currentPocketId === id) handleSelect('all');
    } else {
      toast.error('Gagal menghapus pocket');
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
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide" ref={scrollContainerRef}>
      <div className="flex space-x-2">
        {/* All Pockets Bubble */}
        <Button
          variant={currentPocketId === 'all' ? 'default' : 'outline'}
          size="sm"
          className="rounded-full h-8 px-4 text-xs"
          onClick={() => handleSelect('all')}
        >
          Semua
        </Button>

        {pockets.map((pocket) => (
          <div key={pocket.id} className="relative group">
            <Button
              variant={currentPocketId === pocket.id ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "rounded-full h-8 px-4 text-xs relative", // Extra padding for the menu trigger
                !readonly && "pr-8",
                currentPocketId === pocket.id ? "" : "bg-background/50 backdrop-blur"
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
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted/50 p-0">
                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openShare(pocket); }}>
                      <Users className="mr-2 h-3 w-3" /> Bagikan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(pocket); }}>
                      <Pencil className="mr-2 h-3 w-3" /> Ubah Nama
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(pocket.id); }} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-3 w-3" /> Hapus
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
            className="rounded-full h-8 w-8 border-dashed border-2 shrink-0"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Kantung Baru</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nama</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Contoh: Liburan"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isLoading}>Buat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Nama Pocket</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nama</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nama Pocket"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRename} disabled={isLoading}>Simpan</Button>
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
