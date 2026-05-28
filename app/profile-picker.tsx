"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCrewMember } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ProfilePicker({ crew }: { crew: string[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");

  function selectSailor(name: string) {
    document.cookie = `sailor=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.push("/dashboard");
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await addCrewMember(trimmed);
    selectSailor(trimmed);
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm font-medium">Who are you?</p>
      <div className="grid grid-cols-2 gap-2">
        {crew.map((name) => (
          <Button
            key={name}
            variant="outline"
            className="h-12 text-base"
            onClick={() => selectSailor(name)}
          >
            {name}
          </Button>
        ))}
      </div>
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Your name"
            autoFocus
            className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={handleAdd} disabled={!newName.trim()}>
            Join
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          I&apos;m not on the list
        </Button>
      )}
    </div>
  );
}
