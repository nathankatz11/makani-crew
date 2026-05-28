"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCrewMember } from "@/lib/actions";
import { UserCircle, Plus } from "lucide-react";

export function ProfileSwitcher({
  currentSailor,
  crew,
}: {
  currentSailor: string;
  crew: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  function switchTo(name: string) {
    document.cookie = `sailor=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setIsOpen(false);
    router.refresh();
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const ok = await addCrewMember(trimmed);
    if (ok) {
      setNewName("");
      setIsAdding(false);
      switchTo(trimmed);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] text-muted-foreground"
      >
        <UserCircle className="h-5 w-5" />
        {currentSailor}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setIsAdding(false);
            }}
          />
          <div className="absolute bottom-full right-0 mb-2 z-50 w-44 rounded-lg border bg-card shadow-lg overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Switch profile
            </div>
            <div className="max-h-64 overflow-y-auto">
              {crew.map((name) => (
                <button
                  key={name}
                  onClick={() => switchTo(name)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                    name === currentSailor
                      ? "font-medium text-foreground bg-accent/50"
                      : "text-muted-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="border-t">
              {isAdding ? (
                <div className="p-2 flex gap-1.5">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Name"
                    autoFocus
                    className="flex-1 rounded border bg-transparent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim()}
                    className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add person
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
