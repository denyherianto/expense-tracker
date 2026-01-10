'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getPockets, createPocket } from '@/app/actions/pockets';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function PocketsPage() {
  const [pockets, setPockets] = useState<{ id: string; name: string }[]>([]);
  const [newPocketName, setNewPocketName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPockets();
  }, []);

  async function loadPockets() {
    try {
      const data = await getPockets();
      setPockets(data);
    } catch (error) {
      toast.error('Failed to load pockets');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePocket(e: React.FormEvent) {
    e.preventDefault();
    if (!newPocketName.trim()) return;

    setIsCreating(true);
    const result = await createPocket(newPocketName);
    setIsCreating(false);

    if (result.success && result.data) {
      setPockets((prev) => [result.data!, ...prev]);
      setNewPocketName('');
      toast.success(`Pocket "${result.data.name}" created!`);
    } else {
      toast.error('Failed to create pocket');
    }
  }

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <span className="material-symbols-outlined">arrow_back</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Manage Pockets</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Pocket</CardTitle>
          <CardDescription>Add a new category for your expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePocket} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="pocketName" className="sr-only">Pocket Name</Label>
              <Input
                id="pocketName"
                placeholder="e.g. Vacation, House"
                value={newPocketName}
                onChange={(e) => setNewPocketName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!newPocketName.trim() || isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Your Pockets</h2>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : pockets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
            No pockets found. Create one above!
          </div>
        ) : (
          <div className="grid gap-2">
            {pockets.map((pocket) => (
              <Card key={pocket.id} className="bg-muted/50">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="font-medium">{pocket.name}</span>
                  {/* Future: Add edit/delete buttons here */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
