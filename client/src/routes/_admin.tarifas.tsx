import { createRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ratesApi } from "@/lib/api"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { CategoryLabel, type Category, type Subscription, type PrepaidCredit } from "@/types"
import { Plus, RefreshCw, CheckCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/tarifas",
  component: TarifasPage,
})

const tabs = [
  { key: "hora", label: "Por Hora" },
  { key: "fracciones", label: "Fracciones" },
  { key: "mensualidades", label: "Mensualidades" },
  { key: "abonos", label: "Abonos" },
] as const

type TabKey = (typeof tabs)[number]["key"]

const structureSchema = z.object({
  name: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  effectiveDate: z.string().optional(),
})

const rateSchema = z.object({
  category: z.enum(["A", "B", "C", "D"] as const),
  pricePerHour: z.coerce.number().min(0, "Debe ser >= 0"),
  description: z.string().optional(),
})

const fractionSchema = z.object({
  category: z.enum(["A", "B", "C", "D"] as const),
  minutes15: z.coerce.number().min(0, "Debe ser >= 0"),
  minutes30: z.coerce.number().min(0, "Debe ser >= 0"),
  minutes45: z.coerce.number().min(0, "Debe ser >= 0"),
})

const subscriptionSchema = z.object({
  plate: z.string().min(1, "Requerido"),
  customerName: z.string().min(1, "Requerido"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  monthlyAmount: z.coerce.number().min(0, "Debe ser >= 0"),
  durationMonths: z.coerce.number().min(1, "Mínimo 1 mes").default(1),
  autoRenew: z.boolean().default(false),
})

const creditSchema = z.object({
  plate: z.string().min(1, "Requerido"),
  customerName: z.string().min(1, "Requerido"),
  customerPhone: z.string().optional(),
  amount: z.coerce.number().min(0, "Debe ser >= 0"),
  isHours: z.boolean().default(false),
  expirationDate: z.string().optional(),
})

const rechargeSchema = z.object({
  amount: z.coerce.number().min(1, "Debe ser > 0"),
})

const renewSchema = z.object({
  months: z.coerce.number().min(1, "Mínimo 1 mes"),
})

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="flex border-b mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function TarifasPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("hora")

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Gestión de Tarifas</h2>
        <p className="text-sm text-slate-500">Administre estructuras, fracciones, mensualidades y abonos</p>
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === "hora" && <PorHoraTab />}
      {activeTab === "fracciones" && <FraccionesTab />}
      {activeTab === "mensualidades" && <MensualidadesTab />}
      {activeTab === "abonos" && <AbonosTab />}
    </div>
  )
}

function PorHoraTab() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showRateForm, setShowRateForm] = useState<number | null>(null)

  const { data: structuresData, isLoading } = useQuery({
    queryKey: ["rates", "structures"],
    queryFn: () => ratesApi.getStructures(),
  })

  const createMutation = useMutation({
    mutationFn: ratesApi.createStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "structures"] })
      toast.success("Estructura creada")
      setShowCreate(false)
    },
    onError: () => toast.error("Error al crear estructura"),
  })

  const activateMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date?: string }) => ratesApi.activateStructure(id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "structures"] })
      toast.success("Estructura activada")
    },
    onError: () => toast.error("Error al activar estructura"),
  })

  const createRateMutation = useMutation({
    mutationFn: ratesApi.createRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "structures"] })
      toast.success("Tarifa agregada")
      setShowRateForm(null)
    },
    onError: () => toast.error("Error al crear tarifa"),
  })

  const createForm = useForm({
    resolver: zodResolver(structureSchema),
    defaultValues: { name: "", description: "", effectiveDate: "" },
  })

  const rateForm = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: { category: "A" as Category, pricePerHour: 0, description: "" },
  })

  const structures = structuresData?.data ?? []

  const onActivate = (id: number) => {
    if (window.confirm("¿Activar esta estructura tarifaria?")) {
      activateMutation.mutate({ id })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Estructuras Tarifarias</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Estructura
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
          className="rounded-lg border bg-white p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
              <input
                {...createForm.register("name")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Ej: Tarifa 2025"
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fecha efectiva</label>
              <input
                type="date"
                {...createForm.register("effectiveDate")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción</label>
            <input
              {...createForm.register("description")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Opcional"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : structures.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay estructuras tarifarias
        </div>
      ) : (
        <div className="space-y-3">
          {structures.map((s) => (
            <div key={s.id} className="rounded-lg border bg-white">
              <button
                onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {expandedId === s.id ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.name}</p>
                    {s.description && <p className="text-xs text-slate-400">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_active ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Inactivo</span>
                  )}
                </div>
              </button>

              {expandedId === s.id && (
                <div className="border-t px-4 py-3 space-y-3">
                  {s.effective_date && (
                    <p className="text-xs text-slate-500">
                      Vigencia: {formatDate(s.effective_date)}
                    </p>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-slate-600">Tarifas por Categoría</h4>
                      <button
                        onClick={() => setShowRateForm(showRateForm === s.id ? null : s.id)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar
                      </button>
                    </div>

                    {showRateForm === s.id && (
                      <form
                        onSubmit={rateForm.handleSubmit((data) =>
                          createRateMutation.mutate({ ...data, structureId: s.id }),
                        )}
                        className="mb-3 grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3"
                      >
                        <div>
                          <label className="block text-xs text-slate-500 mb-0.5">Categoría</label>
                          <select
                            {...rateForm.register("category")}
                            className="w-full rounded border px-2 py-1 text-xs"
                          >
                            {(["A", "B", "C", "D"] as Category[]).map((cat) => (
                              <option key={cat} value={cat}>
                                {CategoryLabel[cat]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-0.5">Precio/hora</label>
                          <input
                            type="number"
                            step="0.01"
                            {...rateForm.register("pricePerHour")}
                            className="w-full rounded border px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <button
                            type="submit"
                            disabled={createRateMutation.isPending}
                            className="rounded bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowRateForm(null); rateForm.reset() }}
                            className="rounded border px-2.5 py-1 text-xs text-slate-600"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {s.rates && s.rates.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-slate-500">
                            <th className="pb-2 pr-4">Categoría</th>
                            <th className="pb-2 pr-4">Precio/Hora</th>
                            <th className="pb-2">Descripción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.rates.map((r) => (
                            <tr key={r.id} className="text-xs text-slate-600">
                              <td className="py-1.5 pr-4 font-medium">{CategoryLabel[r.category]}</td>
                              <td className="py-1.5 pr-4">{formatCurrency(r.price_per_hour)}</td>
                              <td className="py-1.5">{r.description ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-slate-400 py-2">No hay tarifas definidas</p>
                    )}
                  </div>

                  {!s.is_active && (
                    <button
                      onClick={() => onActivate(s.id)}
                      disabled={activateMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Activar Estructura
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FraccionesTab() {
  const queryClient = useQueryClient()

  const { data: fractionsData, isLoading } = useQuery({
    queryKey: ["rates", "fractions"],
    queryFn: () => ratesApi.getFractions(),
  })

  const createMutation = useMutation({
    mutationFn: ratesApi.createFraction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "fractions"] })
      toast.success("Fracción creada")
    },
    onError: () => toast.error("Error al crear fracción"),
  })

  const form = useForm({
    resolver: zodResolver(fractionSchema),
    defaultValues: {
      category: "A" as Category,
      minutes15: 0,
      minutes30: 0,
      minutes45: 0,
    },
  })

  const fractions = fractionsData?.data ?? []

  return (
    <div className="space-y-4">
      <form
        onSubmit={form.handleSubmit((data) => createMutation.mutate({ ...data, structureId: 1 }))}
        className="rounded-lg border bg-white p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-slate-700">Nueva Tarifa Fraccionada</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
            <select
              {...form.register("category")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {(["A", "B", "C", "D"] as Category[]).map((cat) => (
                <option key={cat} value={cat}>{CategoryLabel[cat]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">15 min</label>
            <input
              type="number"
              step="0.01"
              {...form.register("minutes15")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">30 min</label>
            <input
              type="number"
              step="0.01"
              {...form.register("minutes30")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">45 min</label>
            <input
              type="number"
              step="0.01"
              {...form.register("minutes45")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createMutation.isPending ? "Creando..." : "Crear Fracción"}
        </button>
      </form>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : fractions.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay tarifas fraccionadas
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">15 min</th>
                <th className="px-4 py-3">30 min</th>
                <th className="px-4 py-3">45 min</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fractions.map((f) => (
                <tr key={f.id} className="text-slate-600 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{CategoryLabel[f.category]}</td>
                  <td className="px-4 py-2.5">{formatCurrency(f.minutes15)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(f.minutes30)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(f.minutes45)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MensualidadesTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [renewId, setRenewId] = useState<number | null>(null)

  const { data: subsData, isLoading } = useQuery({
    queryKey: ["rates", "subscriptions"],
    queryFn: () => ratesApi.getSubscriptions(),
  })

  const createMutation = useMutation({
    mutationFn: ratesApi.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "subscriptions"] })
      toast.success("Mensualidad creada")
      setShowCreate(false)
    },
    onError: () => toast.error("Error al crear mensualidad"),
  })

  const renewMutation = useMutation({
    mutationFn: ({ id, months }: { id: number; months: number }) => ratesApi.renewSubscription(id, months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "subscriptions"] })
      toast.success("Mensualidad renovada")
      setRenewId(null)
    },
    onError: () => toast.error("Error al renovar"),
  })

  const createForm = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      plate: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      monthlyAmount: 0,
      durationMonths: 1,
      autoRenew: false,
    },
  })

  const renewForm = useForm({
    resolver: zodResolver(renewSchema),
    defaultValues: { months: 1 },
  })

  const subscriptions: Subscription[] =
    subsData?.data?.subscriptions ?? (Array.isArray(subsData?.data) ? subsData.data : [])

  const isActive = (s: Subscription) =>
    s.status === "active" && new Date(s.end_date) > new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Mensualidades</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Mensualidad
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createForm.handleSubmit((data) =>
            createMutation.mutate({
              ...data,
              customerEmail: data.customerEmail || undefined,
              startDate: new Date().toISOString().split("T")[0],
            }),
          )}
          className="rounded-lg border bg-white p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Placa</label>
              <input
                {...createForm.register("plate")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="ABC123"
              />
              {createForm.formState.errors.plate && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.plate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre cliente</label>
              <input
                {...createForm.register("customerName")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Juan Pérez"
              />
              {createForm.formState.errors.customerName && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.customerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <input
                {...createForm.register("customerPhone")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="3001234567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                {...createForm.register("customerEmail")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="cliente@correo.com"
              />
              {createForm.formState.errors.customerEmail && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.customerEmail.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Valor mensual</label>
              <input
                type="number"
                step="0.01"
                {...createForm.register("monthlyAmount")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {createForm.formState.errors.monthlyAmount && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.monthlyAmount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duración (meses)</label>
              <input
                type="number"
                {...createForm.register("durationMonths")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...createForm.register("autoRenew")} className="rounded" />
            Auto-renovar
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay mensualidades
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Auto-Renovar</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {subscriptions.map((s) => (
                <tr key={s.id} className="text-xs text-slate-600 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{s.plate ?? s.plate_hash}</td>
                  <td className="px-4 py-2.5">{s.customer_name}</td>
                  <td className="px-4 py-2.5">{formatCurrency(s.monthly_amount)}</td>
                  <td className="px-4 py-2.5">{formatDate(s.start_date)}</td>
                  <td className="px-4 py-2.5">{formatDate(s.end_date)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive(s) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                      )}
                    >
                      {isActive(s) ? "Activo" : "Vencido"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {s.auto_renew ? (
                      <span className="text-green-600">Sí</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {renewId === s.id ? (
                      <form
                        onSubmit={renewForm.handleSubmit((d) =>
                          renewMutation.mutate({ id: s.id, months: d.months }),
                        )}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="number"
                          {...renewForm.register("months")}
                          className="w-14 rounded border px-1.5 py-0.5 text-xs"
                          min={1}
                        />
                        <button
                          type="submit"
                          disabled={renewMutation.isPending}
                          className="rounded bg-green-600 px-1.5 py-0.5 text-xs text-white"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewId(null)}
                          className="rounded border px-1.5 py-0.5 text-xs"
                        >
                          X
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setRenewId(s.id)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Renovar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AbonosTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [rechargeId, setRechargeId] = useState<number | null>(null)

  const { data: creditsData, isLoading } = useQuery({
    queryKey: ["rates", "credits"],
    queryFn: () => ratesApi.getCredits(),
  })

  const createMutation = useMutation({
    mutationFn: ratesApi.createCredit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "credits"] })
      toast.success("Abono creado")
      setShowCreate(false)
    },
    onError: () => toast.error("Error al crear abono"),
  })

  const rechargeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => ratesApi.rechargeCredit(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rates", "credits"] })
      toast.success("Abono recargado")
      setRechargeId(null)
    },
    onError: () => toast.error("Error al recargar"),
  })

  const createForm = useForm({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      plate: "",
      customerName: "",
      customerPhone: "",
      amount: 0,
      isHours: false,
      expirationDate: "",
    },
  })

  const rechargeForm = useForm({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { amount: 0 },
  })

  const credits: PrepaidCredit[] =
    creditsData?.data?.credits ?? (Array.isArray(creditsData?.data) ? creditsData.data : [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Abonos Prepagados</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo Abono
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
          className="rounded-lg border bg-white p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Placa</label>
              <input
                {...createForm.register("plate")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="ABC123"
              />
              {createForm.formState.errors.plate && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.plate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombre cliente</label>
              <input
                {...createForm.register("customerName")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Juan Pérez"
              />
              {createForm.formState.errors.customerName && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.customerName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monto</label>
              <input
                type="number"
                step="0.01"
                {...createForm.register("amount")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {createForm.formState.errors.amount && (
                <p className="mt-1 text-xs text-red-500">{createForm.formState.errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
              <input
                {...createForm.register("customerPhone")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="3001234567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Expiración</label>
              <input
                type="date"
                {...createForm.register("expirationDate")}
                className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" {...createForm.register("isHours")} className="rounded" />
            El abono es en horas (no en dinero)
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creando..." : "Crear"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : credits.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay abonos prepagados
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Placa</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Saldo</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {credits.map((c) => (
                <tr key={c.id} className="text-xs text-slate-600 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{c.plate ?? c.plate_hash}</td>
                  <td className="px-4 py-2.5">{c.customer_name}</td>
                  <td className="px-4 py-2.5">{formatCurrency(c.amount)}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {c.is_hours ? `${c.balance} h` : formatCurrency(c.balance)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                      {c.is_hours ? "Horas" : "Dinero"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : c.status === "exhausted"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-red-100 text-red-700",
                      )}
                    >
                      {c.status === "active" ? "Activo" : c.status === "exhausted" ? "Agotado" : "Vencido"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {c.expiration_date ? formatDate(c.expiration_date) : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {rechargeId === c.id ? (
                      <form
                        onSubmit={rechargeForm.handleSubmit((d) =>
                          rechargeMutation.mutate({ id: c.id, amount: d.amount }),
                        )}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="number"
                          step="0.01"
                          {...rechargeForm.register("amount")}
                          className="w-20 rounded border px-1.5 py-0.5 text-xs"
                          min={0}
                        />
                        <button
                          type="submit"
                          disabled={rechargeMutation.isPending}
                          className="rounded bg-green-600 px-1.5 py-0.5 text-xs text-white"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setRechargeId(null)}
                          className="rounded border px-1.5 py-0.5 text-xs"
                        >
                          X
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setRechargeId(c.id)}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Recargar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
