import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie,
} from "recharts";
import { DollarSign, ShoppingCart, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Order } from "@shared/schema";

interface Analytics {
  orders: {
    total: number;
    revenue: number;
    avgOrderValue: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  products: { total: number; active: number; lowStock: number };
  customers: { total: number };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recentOrders: Order[];
}

const CHART_COLORS = ["#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f87171", "#f472b6"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#fbbf24",
  processing: "#38bdf8",
  shipped: "#a78bfa",
  delivered: "#34d399",
  cancelled: "#f87171",
  refunded: "#94a3b8",
};

export function Dashboard() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: () => apiRequest("/analytics"),
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Revenue" value={formatCurrency(data.orders.revenue)} accent="#34d399" />
        <StatCard icon={<ShoppingCart className="w-4 h-4" />} label="Paid orders" value={String(data.orders.total)} accent="#38bdf8" />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Low stock" value={String(data.products.lowStock)} accent="#fbbf24" />
        <StatCard icon={<Users className="w-4 h-4" />} label="Customers" value={String(data.customers.total)} accent="#a78bfa" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Top products by revenue">
          {data.topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(167,139,250,0.08)" }}
                  contentStyle={{ background: "#151b2e", border: "1px solid #2a3450", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {data.topProducts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Orders by status">
          {data.orders.byStatus.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.orders.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.orders.byStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#151b2e", border: "1px solid #2a3450", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, n: string) => [`${v} orders`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {data.orders.byStatus.map((s) => (
              <span key={s.status} className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] capitalize">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.status] ?? "#94a3b8" }} />
                {s.status} ({s.count})
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel title="Recent orders">
        <RecentOrdersTable />
      </Panel>
    </div>
  );
}

function RecentOrdersTable() {
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => apiRequest("/orders"),
    refetchInterval: 15_000,
  });

  if (orders.length === 0) return <EmptyChart label="No orders yet" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[var(--color-text-subtle)] text-left border-b border-[var(--color-border-subtle)]">
            <th className="pb-2 font-medium">Order</th>
            <th className="pb-2 font-medium">Customer</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border-subtle)]">
          {orders.slice(0, 8).map((o) => (
            <tr key={o.id} className="text-[var(--color-text)]">
              <td className="py-2 font-mono text-[var(--color-text-muted)]">{o.orderNumber}</td>
              <td className="py-2 truncate max-w-[160px]">{o.customerEmail}</td>
              <td className="py-2">
                <span className="inline-flex items-center gap-1 capitalize">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[o.status] ?? "#94a3b8" }} />
                  {o.status}
                </span>
              </td>
              <td className="py-2 text-[var(--color-text-muted)]">{formatDate(o.createdAt)}</td>
              <td className="py-2 text-right font-medium">{formatCurrency(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
          {icon}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      </div>
      <p className="text-xl font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-[var(--color-text-subtle)]" />
        <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function EmptyChart({ label = "No data yet" }: { label?: string }) {
  return (
    <div className="h-[180px] flex items-center justify-center text-xs text-[var(--color-text-subtle)]">
      {label}
    </div>
  );
}
