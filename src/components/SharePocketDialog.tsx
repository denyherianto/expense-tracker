"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sharePocket, getPocketMembers, removeMember } from "@/app/actions/pockets";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SharePocketDialogProps {
  pocketId: string;
  pocketName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isOwner: boolean;
}

export function SharePocketDialog({ pocketId, pocketName, open, onOpenChange, trigger }: SharePocketDialogProps) {
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalIsOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalIsOpen;

  async function loadMembers() {
    setIsLoadingMembers(true);
    const data = await getPocketMembers(pocketId);
    setMembers(data);
    setIsLoadingMembers(false);
  }

  // Fetch members when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pocketId]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsSharing(true);
    const result = await sharePocket(pocketId, email);
    setIsSharing(false);

    if (result.success) {
      toast.success(`Pocket shared with ${email}`);
      setEmail("");
      loadMembers();
    } else {
      toast.error(result.error || "Failed to share pocket");
    }
  }

  async function handleRemoveMember(userId: string) {
      const result = await removeMember(pocketId, userId);
      if (result.success) {
          toast.success("Member removed");
          loadMembers();
      } else {
          toast.error("Failed to remove member");
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
          <DialogTrigger asChild>
            {trigger}
          </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share &quot;{pocketName}&quot;</DialogTitle>
          <DialogDescription>
            Invite others to view and add expenses to this pocket.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleShare} className="flex gap-2 my-4">
          <Input
            id="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            type="email"
            required
          />
          <Button type="submit" disabled={isSharing}>
            {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-4">
            <h4 className="text-sm font-medium">Members</h4>
            {isLoadingMembers ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No members yet</p>
            ) : (
                <div className="space-y-3">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                            <AvatarImage src={member.image || undefined} />
                                    <AvatarFallback>{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="text-sm">
                                    <div className="font-medium">{member.name} {member.isOwner && "(Owner)"}</div>
                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                </div>
                            </div>
                            {!member.isOwner && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveMember(member.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
