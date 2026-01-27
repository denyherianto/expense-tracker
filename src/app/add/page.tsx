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
            <Plus className="mr-2 h-4 w-4" /> Create New Pocket
          </Button>
        </Link>
      ) : (
        <Select value={selectedPocketId} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Pocket" />
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
      recognition.lang = 'en-US';

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
      toast.error('Your browser does not support voice input.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      // State change will happen in onend
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... (Speak now)');
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
      loading: 'Processing transaction...',
      success: (result) => {
        setIsPending(false);
        if (result.success) {
            router.push('/'); // Redirect to dashboard
          return `Successfully processed: ${result.data?.summary}!`;
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
      toast.error('Please take a photo or upload a receipt image.');
      return;
    }

    setIsPending(true);
    const promise = processInvoice(formData);

    toast.promise(promise, {
      loading: 'Scanning receipt...',
      success: (result) => {
         setIsPending(false);
         if (result.success) {
            router.push('/');
           return `Successfully scanned: ${result.data?.summary}!`;
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
    <div className="max-w-md mx-auto px-6 min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-md border-b border-zinc-200/50 -mx-6 px-6 py-4 flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-medium tracking-tight text-zinc-900">Add Expense</h1>
      </header>

      <section className="py-6">
        <Card className="border-zinc-200/60 shadow-subtle rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-zinc-900 text-base">Input Method</CardTitle>
            <CardDescription className="text-zinc-500">Choose how to add your transaction</CardDescription>
          </CardHeader>
          <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-zinc-100 rounded-xl p-1">
              <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-subtle text-zinc-500"><Type className="w-4 h-4 mr-2" /> Text</TabsTrigger>
              <TabsTrigger value="voice" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-subtle text-zinc-500"><Mic className="w-4 h-4 mr-2" /> Voice</TabsTrigger>
              <TabsTrigger value="camera" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-subtle text-zinc-500"><Camera className="w-4 h-4 mr-2" /> Camera</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text">
              <form onSubmit={handleTextSubmit} className="space-y-4">
                <PocketSelector
                  pockets={pockets}
                  selectedPocketId={selectedPocketId}
                  onSelect={setSelectedPocketId}
                />
                <div className="space-y-2">
                  <Label htmlFor="rawText">Description</Label>
                  <Textarea
                    id="rawText"
                    name="rawText"
                    placeholder="E.g., Bought milk 2L, bread total $25"
                    className="min-h-[150px] text-lg resize-none"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base rounded-xl bg-zinc-900 hover:bg-zinc-800" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : 'Process Transaction'}
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
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "default"}
                      size="lg"
                      onClick={toggleListening}
                      className={cn(
                        "h-16 w-16 rounded-full shadow-float mb-4 transition-all duration-300",
                        isListening ? 'animate-pulse scale-110 bg-red-500 hover:bg-red-600' : 'bg-zinc-900 hover:bg-zinc-800 hover:scale-105'
                      )}
                    >
                      {isListening ? (
                        <StopCircle className="h-8 w-8" />
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </Button>
                    <p className="text-sm font-medium text-zinc-500 text-center">
                      {isListening ? 'Listening... (Tap to stop)' : 'Tap microphone to start speaking'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voiceText" className="text-zinc-700">Voice Result</Label>
                    <Textarea
                      id="voiceText"
                      name="rawText"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Voice transcription will appear here..."
                      className="min-h-[100px] text-lg resize-none rounded-xl border-zinc-200 focus:border-zinc-400"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 text-base rounded-xl bg-zinc-900 hover:bg-zinc-800" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : 'Process Transaction'}
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
                    <div className="relative w-full aspect-square bg-zinc-100 rounded-2xl border border-zinc-200 overflow-hidden group">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-zinc-900/50 text-white p-2 rounded-full hover:bg-zinc-900/70 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                      <Label
                        htmlFor="file"
                        className="relative w-full aspect-square bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center overflow-hidden hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Camera className="w-12 h-12 text-zinc-400 mb-2" />
                        <p className="text-sm text-zinc-500 font-medium">Tap to take a photo</p>
                      </Label>
                  )}
                </div>
                <Button type="submit" className="w-full h-12 text-base rounded-xl bg-zinc-900 hover:bg-zinc-800" disabled={isPending}>
                  {isPending ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning...</> : 'Scan Receipt'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
