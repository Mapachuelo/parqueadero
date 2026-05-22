import { createRoute } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { claimsApi } from "@/lib/api"
import { formatDate, formatCurrency, cn } from "@/lib/utils"
import { Route as AdminLayout } from "./_admin"
import {
  ClaimStatusLabel,
  ClaimCategoryLabel,
  type Claim,
  type ClaimStatus,
  type ClaimCategory,
  type ClaimNote,
} from "@/types"
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Paperclip,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Filter,
} from "lucide-react"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/reclamos",
  component: ReclamosPage,
})

const noteSchema = z.object({
  content: z.string().min(1, "Requerido"),
})

const resolveSchema = z.object({
  resolution: z.string().min(1, "Requerido"),
  compensationAmount: z.coerce.number().min(0).optional(),
})

const statusColors: Record<ClaimStatus, string> = {
  abierto: "bg-blue-100 text-blue-700",
  en_investigacion: "bg-amber-100 text-amber-700",
  resuelto: "bg-emerald-100 text-emerald-700",
  rechazado: "bg-red-100 text-red-700",
  vencido: "bg-slate-200 text-slate-600",
}

const categoryColors: Record<ClaimCategory, string> = {
  danio: "bg-red-100 text-red-700",
  cobro_incorrecto: "bg-amber-100 text-amber-700",
  robo_hurto: "bg-red-100 text-red-800",
  perdida: "bg-purple-100 text-purple-700",
  otro: "bg-slate-100 text-slate-600",
}

const statusIcon: Record<ClaimStatus, typeof AlertTriangle> = {
  abierto: AlertTriangle,
  en_investigacion: Clock,
  resuelto: CheckCircle,
  rechazado: XCircle,
  vencido: AlertTriangle,
}

interface DetailedClaim extends Claim {
  notes?: ClaimNote[]
  evidence?: { id: number; file_path: string; description?: string }[]
}

function ReclamosPage() {
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["claims", "list", statusFilter, categoryFilter],
    queryFn: () =>
      claimsApi.list({
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
      }),
  })

  const detailQuery = useQuery({
    queryKey: ["claims", "detail", expandedId],
    queryFn: () => claimsApi.get(expandedId!),
    enabled: expandedId !== null,
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      claimsApi.addNote(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims", "detail"] })
      toast.success("Nota agregada")
      noteForm.reset()
    },
    onError: () => toast.error("Error al agregar nota"),
  })

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      resolution,
      compensationAmount,
    }: {
      id: number
      resolution: string
      compensationAmount?: number
    }) => claimsApi.resolve(id, { resolution, compensationAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims", "list"] })
      queryClient.invalidateQueries({ queryKey: ["claims", "detail"] })
      toast.success("Reclamo resuelto")
      resolveForm.reset()
    },
    onError: () => toast.error("Error al resolver reclamo"),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ClaimStatus }) =>
      claimsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims", "list"] })
      queryClient.invalidateQueries({ queryKey: ["claims", "detail"] })
      toast.success("Estado actualizado")
    },
    onError: () => toast.error("Error al actualizar estado"),
  })

  const noteForm = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: "" },
  })

  const resolveForm = useForm({
    resolver: zodResolver(resolveSchema),
    defaultValues: { resolution: "", compensationAmount: undefined },
  })

  const claims: Claim[] = claimsData?.data?.claims ?? []

  const handleToggleExpand = (claimId: number) => {
    setExpandedId(expandedId === claimId ? null : claimId)
  }

  const detail = detailQuery.data?.data as DetailedClaim | undefined

  const nextStatuses: Partial<Record<ClaimStatus, ClaimStatus[]>> = {
    abierto: ["en_investigacion"],
    en_investigacion: ["resuelto", "rechazado"],
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Gestión de Reclamos</h2>
        <p className="text-sm text-slate-500">
          Administre reclamos, quejas y solicitudes de compensación
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Filtros:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ClaimStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(ClaimCategoryLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {claimsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : claims.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No se encontraron reclamos
        </div>
      ) : (
        <div className="space-y-2">
          {claims.map((claim) => {
            const isExpanded = expandedId === claim.id
            const isLoadingDetail = isExpanded && detailQuery.isLoading

            return (
              <div
                key={claim.id}
                className="rounded-lg border bg-white overflow-hidden"
              >
                <button
                  onClick={() => handleToggleExpand(claim.id)}
                  className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="text-xs font-mono font-medium text-slate-500 min-w-[80px]">
                      {claim.claim_id}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 min-w-[80px]">
                    {claim.transaction_id ?? "—"}
                  </span>

                  <span
                    className={cn(
                      "inline-flex rounded px-1.5 py-0.5 text-xs font-medium shrink-0",
                      categoryColors[claim.category],
                    )}
                  >
                    {ClaimCategoryLabel[claim.category]}
                  </span>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                      statusColors[claim.status],
                    )}
                  >
                    {(() => {
                      const Icon = statusIcon[claim.status]
                      return <Icon className="h-3 w-3" />
                    })()}
                    {ClaimStatusLabel[claim.status]}
                  </span>

                  <p className="flex-1 text-xs text-slate-500 truncate min-w-0">
                    {claim.description}
                  </p>

                  <span className="text-xs text-slate-400 shrink-0">
                    {formatDate(claim.created_at)}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50/50 px-4 py-4">
                    {isLoadingDetail ? (
                      <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : detail ? (
                      <div className="space-y-5">
                        <div>
                          <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2">
                            Descripción
                          </h4>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">
                            {detail.description}
                          </p>
                        </div>

                        {detail.evidence && detail.evidence.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                              <Paperclip className="h-3.5 w-3.5" />
                              Evidencias
                            </h4>
                            <div className="space-y-1.5">
                              {detail.evidence.map((e) => (
                                <div
                                  key={e.id}
                                  className="flex items-center gap-2 rounded-md bg-white border px-3 py-2 text-xs"
                                >
                                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="font-mono text-slate-600">{e.file_path}</span>
                                  {e.description && (
                                    <span className="text-slate-400">— {e.description}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {detail.notes && detail.notes.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1.5">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Notas ({detail.notes.length})
                            </h4>
                            <div className="space-y-2">
                              {detail.notes.map((note) => (
                                <div
                                  key={note.id}
                                  className="rounded-md bg-white border px-3 py-2"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-700">
                                      {note.user?.full_name ?? "Sistema"}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatDate(note.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <form
                          onSubmit={noteForm.handleSubmit((data) =>
                            addNoteMutation.mutate({ id: claim.id, content: data.content }),
                          )}
                          className="flex gap-2"
                        >
                          <input
                            {...noteForm.register("content")}
                            className="flex-1 rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="Agregar nota..."
                          />
                          <button
                            type="submit"
                            disabled={addNoteMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                            Agregar
                          </button>
                        </form>

                        {detail.status !== "resuelto" && detail.status !== "rechazado" && (
                          <div className="rounded-lg border bg-white p-3 space-y-3">
                            <h4 className="text-xs font-semibold text-slate-600">
                              Resolver Reclamo
                            </h4>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Resolución
                              </label>
                              <textarea
                                {...resolveForm.register("resolution")}
                                rows={3}
                                className="w-full rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                                placeholder="Describa la resolución del reclamo..."
                              />
                              {resolveForm.formState.errors.resolution && (
                                <p className="mt-1 text-xs text-red-500">
                                  {resolveForm.formState.errors.resolution.message}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Compensación (opcional)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                {...resolveForm.register("compensationAmount")}
                                className="w-48 rounded-md border px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="0.00"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={resolveForm.handleSubmit(
                                (data) =>
                                  resolveMutation.mutate({
                                    id: claim.id,
                                    resolution: data.resolution,
                                    compensationAmount: data.compensationAmount
                                      ? Number(data.compensationAmount)
                                      : undefined,
                                  }),
                              )}
                              disabled={resolveMutation.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {resolveMutation.isPending ? "Resolviendo..." : "Resolver Reclamo"}
                            </button>
                          </div>
                        )}

                        {nextStatuses[detail.status] && nextStatuses[detail.status]!.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500">
                              Cambiar estado:
                            </span>
                            {nextStatuses[detail.status]!.map((nextStatus) => (
                              <button
                                key={nextStatus}
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: claim.id, status: nextStatus })
                                }
                                disabled={updateStatusMutation.isPending}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                                  statusColors[nextStatus],
                                )}
                              >
                                {ClaimStatusLabel[nextStatus]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center text-sm text-slate-400">
                        Error al cargar detalles
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
