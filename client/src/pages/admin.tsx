import { StoreNav } from "@/components/StoreNav";
import { Dashboard } from "@/components/admin/Dashboard";
import { AriaChatPanel } from "@/components/admin/AriaChatPanel";

export default function Admin() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <StoreNav />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Store admin</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Live dashboard on the left, Aria on the right — orders placed in the shop show up here instantly.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-4">
          {/* Dashboard */}
          <div className="min-w-0">
            <Dashboard />
          </div>

          {/* Aria chat — sticky, full height */}
          <div className="lg:sticky lg:top-20 h-[calc(100vh-7rem)]">
            <AriaChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
