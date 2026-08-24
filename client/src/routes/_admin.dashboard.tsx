import { createRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { reportsApi, transactionsApi, spacesApi } from "@/lib/api"
import { formatCurrency, cn } from "@/lib/utils"
import { DollarSign, RefreshCw, ParkingCircle, Loader2, TrendingUp } from "lucide-react"
import { Route as AdminLayout } from "./_admin"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { Category } from "@/types"
import { CategoryLabel } from "@/types"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/dashboard",
  component: DashboardPage,
})

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  accent: "blue" | "green" | "amber" | "purple"
}) {
  const borderColor = {
    blue: "border-l-blue-500",
    green: "border-l-green-500",
    amber: "border-l-amber-500",
    purple: "border-l-purple-500",
  }
  const accentIcon = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
  }

  return (
    <div className={cn("rounded-xl border-l-4 bg-white p-5 shadow-sm", borderColor[accent])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", accentIcon[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const occupancyQuery = useQuery({
    queryKey: ["reports", "occupancy"],
    queryFn: () => reportsApi.occupancy(),
  })

  const revenueQuery = useQuery({
    queryKey: ["reports", "revenue"],
    queryFn: () => reportsApi.revenue(),
  })

  const activeQuery = useQuery({
    queryKey: ["transactions", "active", 1],
    queryFn: () => transactionsApi.active(1, 10),
  })

  const spacesQuery = useQuery({
    queryKey: ["spaces", "occupancy"],
    queryFn: () => spacesApi.occupancy(),
  })

  const anyLoading =
    occupancyQuery.isLoading ||
    revenueQuery.isLoading ||
    activeQuery.isLoading ||
    spacesQuery.isLoading

  if (anyLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const occupancy = occupancyQuery.data?.data
  const revenue = revenueQuery.data?.data
  const activeTransactions = activeQuery.data?.data
  const spacesOcc = spacesQuery.data?.data

  const occupancyPct = occupancy?.current?.occupancy_pct ?? 0
  const revenueTotal = revenue?.summary?.total_revenue ?? 0
  const activeCount = activeTransactions?.total ?? 0
  const freeSpaces = spacesOcc?.free ?? 0

  const historical = occupancy?.historical

  const revenueByCategory =
    revenue?.by_category?.map((c) => ({
      name: CategoryLabel[c.category as Category] ?? c.category,
      ingresos: c.revenue,
      transacciones: c.count,
    })) ?? []

  const recentTransactions = activeTransactions?.data?.slice(0, 10) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">Resumen general del parqueadero</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Ocupación actual"
          value={`${occupancyPct.toFixed(1)}%`}
          subtitle={`${spacesOcc?.occupied ?? 0} de ${spacesOcc?.total ?? 0} espacios`}
          icon={TrendingUp}
          accent="blue"
        />
        <KpiCard
          title="Ingresos del día"
          value={formatCurrency(revenueTotal)}
          subtitle={
            revenue?.period
              ? `Período: ${revenue.period.from ?? "todo"} → ${revenue.period.to ?? "todo"}`
              : undefined
          }
          icon={DollarSign}
          accent="green"
        />
        <KpiCard
          title="Transacciones activas"
          value={String(activeCount)}
          subtitle="Vehículos en el parqueadero"
          icon={RefreshCw}
          accent="amber"
        />
        <KpiCard
          title="Espacios libres"
          value={String(freeSpaces)}
          subtitle={`${spacesOcc?.total ?? 0} espacios totales`}
          icon={ParkingCircle}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Ocupación
          </h3>
          {historical ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Hora pico</p>
                <p className="text-lg font-bold text-slate-800">{historical.peak_entry_hour}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Hora valle</p>
                <p className="text-lg font-bold text-slate-800">{historical.valley_entry_hour}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Entradas</p>
                <p className="text-lg font-bold text-slate-800">{historical.total_entries}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Duración promedio</p>
                <p className="text-lg font-bold text-slate-800">{historical.avg_duration_minutes} min</p>
              </div>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">
              Sin datos históricos
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            Ingresos por Categoría
          </h3>
          {revenueByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">
              Sin datos de ingresos
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-700">
          Transacciones Activas Recientes
        </h3>
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Placa</th>
                  <th className="pb-3 pr-4">Categoría</th>
                  <th className="pb-3 pr-4">Cliente</th>
                  <th className="pb-3 pr-4">Ingreso</th>
                  <th className="pb-3 pr-4">Espacio</th>
                  <th className="pb-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="text-slate-600 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 font-mono text-xs">{t.transaction_id}</td>
                    <td className="py-2.5 pr-4">{t.plate ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                        {CategoryLabel[t.category]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{t.customer_name}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {new Date(t.entry_time).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 pr-4">{t.space_assigned ?? "—"}</td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          t.status === "active"
                            ? "bg-green-100 text-green-700"
                            : t.status === "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {t.status === "active" ? "Activo" : t.status === "completed" ? "Completado" : "Cancelado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-slate-400">
            No hay transacciones activas
          </div>
        )}
      </div>
    </div>
  )
}
