"use client";

import { useState, useTransition } from "react";
import { addNote } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RaceNote } from "@/lib/schema";

export function RaceNotes({
  raceDate,
  sailor,
  existingNotes,
}: {
  raceDate: string;
  sailor: string;
  existingNotes: RaceNote[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    if (!note.trim()) return;
    startTransition(async () => {
      await addNote(raceDate, sailor, note.trim());
      setNote("");
      setIsOpen(false);
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
        Add a note
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="e.g. I'll be 10 min late..."
        className="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        autoFocus
      />
      <Button
        size="sm"
        disabled={isPending || !note.trim()}
        onClick={handleSubmit}
      >
        <Send className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
