"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login"); // Redirect to login after logout
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                }
            }
        });
        setIsLoading(false);
    };

    return (
        <Button
            variant="outline"
            className="w-full flex items-center gap-2 rounded-xl border-zinc-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
            onClick={handleLogout}
            disabled={isLoading}
        >
            <LogOut className="h-4 w-4" />
            {isLoading ? "Signing out..." : "Sign Out"}
        </Button>
    );
}
