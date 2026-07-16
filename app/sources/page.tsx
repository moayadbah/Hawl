"use client";

import { useRouter } from "next/navigation";
import { HawlLogo } from "@/components/brand/HawlLogo";
import { Sources } from "@/components/screens/Sources";

// Standalone, directly-linkable route (bookmarks/sharing). The in-app footer link
// instead renders <Sources> as a step inside HawlApp, so it never loses flow state.
export default function SourcesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-alinma-sand/40 pb-16">
      <header className="border-b border-alinma-navy/[0.06] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-5">
          <HawlLogo size={30} />
        </div>
      </header>
      <div className="mt-8">
        <Sources onBack={() => router.back()} />
      </div>
    </div>
  );
}
