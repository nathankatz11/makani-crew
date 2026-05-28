"use client";

import { useState, useTransition } from "react";
import { addNote, deleteNote, editNote } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Send, Trash2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RaceNote } from "@/lib/schema";

function NoteItem({
  note,
  sailor,
}: {
  note: RaceNote;
  sailor: string;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.note);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteNote(note.id);
      router.refresh();
    });
  }

  function handleSave() {
    if (!text.trim() || text.trim() === note.note) { setEditing(false); return; }
    startTransition(async () => {
      await editNote(note.id, text.trim());
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
          rows={3}
          className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          autoFocus
        />
        <div className="flex gap-1.5">
          <Button size="sm" disabled={isPending} onClick={handleSave}><Send className="h-3.5 w-3.5 mr-1" />Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 group">
      <p className="text-sm flex-1">
        <span className="font-medium">{note.sailorName}:</span>{" "}
        <span className="text-muted-foreground">{note.note}</span>
      </p>
      {note.sailorName === sailor && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setEditing(true)} disabled={isPending} className="p-1 text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={handleDelete} disabled={isPending} className="p-1 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

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

  return (
    <div className="space-y-1.5">
      {existingNotes.map((n) => (
        <NoteItem key={n.id} note={n} sailor={sailor} />
      ))}

      {isOpen ? (
        <div className="space-y-1.5 pt-1">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setIsOpen(false); }}
            placeholder="e.g. I'll be 10 min late, great race tonight..."
            rows={3}
            className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button size="sm" disabled={isPending || !note.trim()} onClick={handleSubmit}>
              <Send className="h-3.5 w-3.5 mr-1" />Send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7 px-2" onClick={() => setIsOpen(true)}>
          <MessageSquarePlus className="h-3.5 w-3.5 mr-1" />
          Add a note
        </Button>
      )}
    </div>
  );
}
