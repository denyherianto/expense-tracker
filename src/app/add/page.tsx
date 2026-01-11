'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Type, Plus, Mic, StopCircle, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { processInvoice } from '@/app/actions/invoice';
import { getPockets } from '@/app/actions/pockets';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface IWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition: any;
}

function PocketSelector({
  pockets,
  selectedPocketId,
  onSelect
}: {
  pockets: { id: string; name: string }[],
  selectedPocketId: string,
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Pocket</label>
      {pockets.length === 0 ? (
        <Link href="/" className="block">
          <Button variant="outline" className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" /> Buat Kantung Baru
          </Button>
        </Link>
      ) : (
        <Select value={selectedPocketId} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Pocket" />
          </SelectTrigger>
          <SelectContent>
            {pockets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export default function AddInvoicePage() {
  const [isPending, setIsPending] = useState(false);
  const [pockets, setPockets] = useState<{ id: string; name: string }[]>([]);
  const [selectedPocketId, setSelectedPocketId] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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

  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as unknown as IWindow).webkitSpeechRecognition) {
      const recognition = new (window as unknown as IWindow).webkitSpeechRecognition();
      recognition.continuous = false; // Stop after one sentence
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setText((prev) => prev + (prev ? '\n' : '') + finalTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Browser Anda tidak mendukung input suara.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      // State change will happen in onend
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Mendengarkan... (Bicara sekarang)');
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  async function handleTextSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('pocketId', selectedPocketId);
    
    setIsPending(true);
    const promise = processInvoice(formData);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    // Reset file input
    const fileInput = document.getElementById('file') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  async function handleImageSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('pocketId', selectedPocketId);
    
    // Check if file is present
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      toast.error('Mohon ambil foto atau upload gambar struk.');
      return;
    }

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

  return (
    <div className="container max-w-md mx-auto p-4 min-h-screen">
      <div className="flex items-center gap-4 mb-6 pt-2">
        <Link href="/">
          <Button variant="ghost" size="icon" className="-ml-3"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Catat Pengeluaran</h1>
      </div>

      <Card className="border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle>Metode Input</CardTitle>
          <CardDescription>Pilih cara menambahkan transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" /> Teks</TabsTrigger>
              <TabsTrigger value="voice"><Mic className="w-4 h-4 mr-2" /> Suara</TabsTrigger>
              <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" /> Kamera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <PocketSelector
                  pockets={pockets}
                  selectedPocketId={selectedPocketId}
                  onSelect={setSelectedPocketId}
                />
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

            <TabsContent value="voice">
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <PocketSelector
                  pockets={pockets}
                  selectedPocketId={selectedPocketId}
                  onSelect={setSelectedPocketId}
                />
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-muted/30">
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "default"}
                      size="lg"
                      onClick={toggleListening}
                      className={cn(
                        "h-16 w-16 rounded-full shadow-lg mb-4 transition-all duration-300",
                        isListening ? 'animate-pulse scale-110' : 'hover:scale-105'
                      )}
                    >
                      {isListening ? (
                        <StopCircle className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                    <p className="text-sm font-medium text-muted-foreground text-center">
                      {isListening ? 'Mendengarkan... (Ketuk untuk berhenti)' : 'Ketuk mikrofon untuk mulai bicara'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voiceText">Hasil Suara</Label>
                    <Textarea
                      id="voiceText"
                      name="rawText"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Hasil suara akan muncul di sini..."
                      className="min-h-[100px] text-lg resize-none"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</> : 'Proses Transaksi'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="camera">
               <form onSubmit={handleImageSubmit} className="space-y-4">
                <PocketSelector
                  pockets={pockets}
                  selectedPocketId={selectedPocketId}
                  onSelect={setSelectedPocketId}
                />
                <div className="space-y-2">
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="file" className="sr-only">Upload Receipt</Label>
                  {previewUrl ? (
                    <div className="relative w-full aspect-square bg-muted rounded-xl border border-border overflow-hidden group">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain" // Contain to show full receipt
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                      <Label
                        htmlFor="file"
                        className="relative w-full aspect-square bg-muted rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground font-medium">Ketuk untuk ambil foto</p>
                      </Label>
                  )}
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
