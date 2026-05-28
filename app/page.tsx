import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfilePicker } from "./profile-picker";
import { getCrewList } from "@/lib/actions";
import { Anchor } from "lucide-react";

export default async function Home() {
  const cookieStore = await cookies();
  const existingSailor = cookieStore.get("sailor")?.value;

  let crew: string[];
  try {
    crew = await getCrewList();
  } catch {
    const { DEFAULT_CREW } = await import("@/lib/crew");
    crew = DEFAULT_CREW;
  }

  if (existingSailor && crew.includes(existingSailor)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Anchor className="h-10 w-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">
            Makani u&#x2019;i
          </h1>
          <p className="text-sm text-muted-foreground">
            Wednesday night racing &middot; DuSable Harbor
          </p>
        </div>
        <ProfilePicker crew={crew} />
      </div>
    </div>
  );
}
