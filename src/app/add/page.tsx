'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Type, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { processInvoice } from '@/app/actions/invoice';
import { getPockets } from '@/app/actions/pockets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddInvoicePage() {
  const [isPending, setIsPending] = useState(false);
  const [pockets, setPockets] = useState<{ id: string; name: string }[]>([]);
  const [selectedPocketId, setSelectedPocketId] = useState<string>('');
  
  const router = useRouter();

  useEffect(() => {
    // Fetch pockets on mount
    getPockets().then((data) => {
        setPockets(data);
        if (data.length > 0) {
            setSelectedPocketId(data[0].id);
        }
    });
  }, []);

  async function handleTextSubmit(formData: FormData) {
    formData.append('pocketId', selectedPocketId);
    
    setIsPending(true);
    const promise = processInvoice(formData);
    console.log('promise', promise)
    toast.promise(promise, {
      loading: 'Memproses transaksi...',
      success: (result) => {
        setIsPending(false);
        if (result.success) {
            router.push('/'); // Redirect to dashboard
          return `Berhasil memproses transaksi ${result.data?.summary}!`;
        } else {
            throw new Error(result.error);
        }
      },
      error: (err) => {
        setIsPending(false);
        return `Error: ${err.message}`;
      },
    });
  }

  async function handleImageSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('pocketId', selectedPocketId);
    
    setIsPending(true);
    const promise = processInvoice(formData);

    toast.promise(promise, {
      loading: 'Memindai struk...',
      success: (result) => {
         setIsPending(false);
         if (result.success) {
            router.push('/'); 
           return `Berhasil memindai struk ${result.data?.summary}!`;
         } else {
             throw new Error(result.error);
         }
      },
      error: (err) => {
        setIsPending(false);
        return `Error: ${err.message}`;
      },
    });
  }

  const PocketSelector = () => (
    <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Pocket</label>
        <div className="flex flex-wrap gap-2">
            {pockets.length === 0 ? (
                 <Link href="/pockets" className="w-full">
                    <Button variant="outline" className="w-full border-dashed">
              <Plus className="mr-2 h-4 w-4" /> Buat Pocket Baru
                    </Button>
                 </Link>
            ) : (
                pockets.map(p => (
                    <Button
                        key={p.id}
                        type="button"
                        variant={selectedPocketId === p.id ? 'default' : 'outline'}
                        onClick={() => setSelectedPocketId(p.id)}
                        className="flex-1 min-w-[30%] capitalize"
                    >
                        {p.name}
                    </Button>
                ))
            )}
        </div>
    </div>
  );

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
            <Button variant="ghost" size="icon"><span className="material-symbols-outlined">arrow_back</span></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Tambah Transaksi</h1>
            {/* <p className="text-sm text-muted-foreground">Record your expenses instantly.</p> */}
        </div>
      </div>

      <Card className="border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle>Metode Input</CardTitle>
          <CardDescription>Pilih cara menambahkan transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" /> Teks</TabsTrigger>
              <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" /> Kamera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <form action={handleTextSubmit} className="space-y-4">
                <PocketSelector />
                <div className="space-y-2">
                  <Label htmlFor="rawText">Deskripsi</Label>
                  <Textarea 
                    id="rawText" 
                    name="rawText" 
                    placeholder="Contoh: Beli Susu 2L, Roti total Rp50.000" 
                    className="min-h-[150px] text-lg resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</> : 'Proses Transaksi'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="camera">
               <form onSubmit={handleImageSubmit} className="space-y-4">
                <PocketSelector />
                <div className="space-y-2">
                  <Label htmlFor="file" className="sr-only">Upload Receipt</Label>
                  <div className="relative w-full aspect-square bg-muted rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center overflow-hidden hover:bg-accent/50 transition-colors">
                      <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Ketuk untuk ambil foto</p>
                      <Input 
                        id="file" 
                        name="file" 
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memindai...</> : 'Scan Struk'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
