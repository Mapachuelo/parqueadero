import { createRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/lib/api"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { CategoryLabel, PaymentMethodLabel, type Category, type PaymentMethod } from "@/types"
import { toast } from "sonner"
import { Route as AdminLayout } from "./_admin"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Download, Loader2, Search } from "lucide-react"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/reportes",
  component: ReportesPage,
})

const tabs = [
  { key: "ocupacion", label: "Ocupación" },
  { key: "ingresos", label: "Ingresos" },
  { key: "transacciones", label: "Transacciones" },
  { key: "usuarios", label: "Usuarios" },
  { key: "compliance", label: "Compliance" },
] as const

type TabKey = (typeof tabs)[number]["key"]

function ReportesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ocupacion")
  const today = new Date().toISOString().split("T")[0]
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Reportes</h2>
        <p className="text-sm text-slate-500">Genere y visualice reportes del sistema</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ocupacion" && <OcupacionTab from={from} to={to} />}
      {activeTab === "ingresos" && <IngresosTab from={from} to={to} />}
      {activeTab === "transacciones" && <TransaccionesTab from={from} to={to} />}
      {activeTab === "usuarios" && <UsuariosTab from={from} to={to} />}
      {activeTab === "compliance" && <ComplianceTab from={from} to={to} />}
    </div>
  )
}

function OcupacionTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "occupancy", from, to],
    queryFn: () => reportsApi.occupancy(from, to),
  })

  const report = data?.data

  return (
    <ReportCard title="Reporte de Ocupación" isLoading={isLoading} isError={isError}>
      {report && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatPill label="Total espacios" value={String(report.current.total_spaces)} />
            <StatPill label="Ocupados" value={String(report.current.occupied_spaces)} color="amber" />
            <StatPill label="Libres" value={String(report.current.free_spaces)} color="green" />
          </div>
          <p className="text-sm text-slate-600 mb-3">
            Tasa de ocupación: <span className="font-bold text-slate-800">{report.current.occupancy_pct.toFixed(1)}%</span>
          </p>
          {report.historical ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatPill label="Hora pico" value={report.historical.peak_entry_hour} color="amber" />
              <StatPill label="Hora valle" value={report.historical.valley_entry_hour} />
              <StatPill label="Duración promedio" value={`${report.historical.avg_duration_minutes} min`} />
              <StatPill label="Entradas" value={String(report.historical.total_entries)} color="green" />
              <StatPill label="Salidas" value={String(report.historical.total_exits)} color="green" />
            </div>
          ) : (
            <EmptyChart>Seleccione un rango de fechas para ver el histórico</EmptyChart>
          )}
        </>
      )}
    </ReportCard>
  )
}

function IngresosTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "revenue", from, to],
    queryFn: () => reportsApi.revenue(from, to),
  })

  const report = data?.data

  const totalGross = (report?.summary.total_revenue ?? 0) + (report?.summary.total_discounts ?? 0)

  const byCategory =
    report?.by_category?.map((c) => ({
      name: CategoryLabel[c.category as Category] ?? c.category,
      ingresos: c.revenue,
      count: c.count,
    })) ?? []

  const byPayment =
    report?.by_payment_method?.map((p) => ({
      name: PaymentMethodLabel[p.payment_method as PaymentMethod] ?? p.payment_method,
      ingresos: p.revenue,
      count: p.count,
    })) ?? []

  return (
    <ReportCard title="Reporte de Ingresos" isLoading={isLoading} isError={isError}>
      {report && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatPill label="Total bruto" value={formatCurrency(totalGross)} />
            <StatPill label="Descuentos" value={formatCurrency(report.summary.total_discounts)} color="amber" />
            <StatPill label="Neto" value={formatCurrency(report.summary.total_revenue)} color="green" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Ingresos por Categoría</h4>
              {byCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart>Sin datos por categoría</EmptyChart>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Ingresos por Medio de Pago</h4>
              {byPayment.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs font-medium text-slate-500">
                        <th className="pb-2">Método</th>
                        <th className="pb-2">Transacciones</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {byPayment.map((p) => (
                        <tr key={p.name} className="text-slate-600">
                          <td className="py-2 text-xs">{p.name}</td>
                          <td className="py-2 text-xs">{p.count}</td>
                          <td className="py-2 text-right text-xs font-medium">{formatCurrency(p.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyChart>Sin datos por medio de pago</EmptyChart>
              )}
            </div>
          </div>
        </>
      )}
    </ReportCard>
  )
}

function TransaccionesTab({ from, to }: { from: string; to: string }) {
  const [filter, setFilter] = useState("")
  const [sortField, setSortField] = useState<string>("entry_time")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "transactions", from, to],
    queryFn: () => reportsApi.transactions({ from, to }),
  })

  const transactions = data?.data?.data ?? []

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (filter) {
      const f = filter.toLowerCase()
      list = list.filter(
        (t) =>
          t.transaction_id?.toLowerCase().includes(f) ||
          t.plate?.toLowerCase().includes(f) ||
          t.customer_name?.toLowerCase().includes(f),
      )
    }
    list.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? ""
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? ""
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === "asc" ? cmp : -cmp
    })
    return list
  }, [transactions, filter, sortField, sortDir])

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const handleExport = () => {
    toast.info("Exportación CSV no disponible en demo")
  }

  return (
    <ReportCard title="Reporte de Transacciones" isLoading={isLoading} isError={isError}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Filtrar..."
          />
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
          No se encontraron transacciones
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium text-slate-500">
                {[
                  { key: "transaction_id", label: "ID" },
                  { key: "plate", label: "Placa" },
                  { key: "category", label: "Categoría" },
                  { key: "customer_name", label: "Cliente" },
                  { key: "entry_time", label: "Ingreso" },
                  { key: "exit_time", label: "Salida" },
                  { key: "status", label: "Estado" },
                  { key: "total_amount", label: "Total" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="cursor-pointer select-none pb-3 pr-4 hover:text-slate-700"
                  >
                    {col.label}{" "}
                    {sortField === col.key && (
                      <span className="text-primary">{sortDir === "asc" ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((t) => (
                <tr key={t.id} className="text-xs text-slate-600 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-mono">{t.transaction_id}</td>
                  <td className="py-2 pr-4">{t.plate ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                      {CategoryLabel[t.category]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{t.customer_name}</td>
                  <td className="py-2 pr-4">{formatDate(t.entry_time)}</td>
                  <td className="py-2 pr-4">{t.exit_time ? formatDate(t.exit_time) : "—"}</td>
                  <td className="py-2 pr-4">
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
                  <td className="py-2 pr-4 font-medium">
                    {t.total_amount ? formatCurrency(t.total_amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  )
}

function UsuariosTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "users", from, to],
    queryFn: () => reportsApi.users(from, to),
  })

  const users = data?.data?.operators ?? []

  return (
    <ReportCard title="Reporte de Usuarios" isLoading={isLoading} isError={isError}>
      {users.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
          No hay datos de productividad
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase text-slate-500">
                <th className="pb-3 pr-4">Operador</th>
                <th className="pb-3 pr-4">Entradas</th>
                <th className="pb-3 pr-4">Salidas</th>
                <th className="pb-3 pr-4">Pagos procesados</th>
                <th className="pb-3 pr-4">Total facturado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u, i) => (
                <tr key={i} className="text-xs text-slate-600 hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-medium">{String(u.full_name ?? u.username ?? "—")}</td>
                  <td className="py-2.5 pr-4">{String(u.entries_processed ?? 0)}</td>
                  <td className="py-2.5 pr-4">{String(u.exits_processed ?? 0)}</td>
                  <td className="py-2.5 pr-4">{String(u.completed_transactions ?? 0)}</td>
                  <td className="py-2.5 pr-4 font-medium">
                    {formatCurrency(Number(u.total_revenue ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  )
}

function ComplianceTab({ from, to }: { from: string; to: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "compliance", from, to],
    queryFn: () => reportsApi.compliance(from, to),
  })

  const report = data?.data

  type ComplianceMetric = {
    label: string
    value: string | number
    isPercent?: boolean
    status: "good" | "warning" | "bad"
  }

  const metrics: ComplianceMetric[] = report
    ? [
        {
          label: "Emisión de tickets",
          value: report.tickets.emission_rate_pct,
          isPercent: true,
          status: report.tickets.emission_rate_pct >= 90 ? "good" : report.tickets.emission_rate_pct >= 70 ? "warning" : "bad",
        },
        {
          label: "Términos de custodia",
          value: report.tickets.custody_terms_rate_pct,
          isPercent: true,
          status: report.tickets.custody_terms_rate_pct >= 95 ? "good" : report.tickets.custody_terms_rate_pct >= 80 ? "warning" : "bad",
        },
        {
          label: "Tickets emitidos",
          value: `${report.tickets.tickets_emitted}/${report.tickets.total_transactions}`,
          status: "good",
        },
        {
          label: "Reclamos abiertos",
          value: report.claims.open,
          status: report.claims.open <= 5 ? "good" : report.claims.open <= 10 ? "warning" : "bad",
        },
        {
          label: "Resueltos a tiempo",
          value: report.claims.resolved_on_time,
          status: report.claims.resolved_on_time >= 80 ? "good" : report.claims.resolved_on_time >= 60 ? "warning" : "bad",
        },
        {
          label: "Reclamos vencidos",
          value: report.claims.expired,
          status: report.claims.expired === 0 ? "good" : report.claims.expired <= 3 ? "warning" : "bad",
        },
      ]
    : []

  const statusColor = {
    good: "border-l-green-500 bg-green-50",
    warning: "border-l-amber-500 bg-amber-50",
    bad: "border-l-red-500 bg-red-50",
  }
  const statusTextColor = {
    good: "text-green-700",
    warning: "text-amber-700",
    bad: "text-red-700",
  }

  return (
    <ReportCard title="Reporte de Compliance" isLoading={isLoading} isError={isError}>
      {report && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className={cn("rounded-lg border-l-4 p-4", statusColor[m.status])}
            >
              <p className="text-xs text-slate-500 mb-1">{m.label}</p>
              <p className={cn("text-xl font-bold", statusTextColor[m.status])}>
                {m.isPercent ? `${m.value}%` : m.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </ReportCard>
  )
}

function ReportCard({
  title,
  children,
  isLoading,
  isError,
}: {
  title: string
  children: React.ReactNode
  isLoading: boolean
  isError: boolean
}) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : isError ? (
        <div className="flex h-48 items-center justify-center text-sm text-red-500">
          Error al cargar el reporte
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function StatPill({ label, value, color = "blue" }: { label: string; value: string; color?: "blue" | "green" | "amber" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  }
  return (
    <div className={cn("rounded-lg px-4 py-3 text-center", colors[color])}>
      <p className="text-xs font-medium opacity-75">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  )
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-slate-400">
      {children}
    </div>
  )
}
