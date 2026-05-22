import { createRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { legalApi } from "@/lib/api"
import { formatDate, cn } from "@/lib/utils"
import type { CustodyTerms, LegalChecklist, LegalChecklistItem } from "@/types"
import {
  Plus,
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Award,
  FileText,
  X,
} from "lucide-react"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/legal",
  component: LegalPage,
})

const tabs = [
  { key: "terminos", label: "Términos de Custodia" },
  { key: "checklists", label: "Checklists" },
] as const

type TabKey = (typeof tabs)[number]["key"]

const custodyTermsSchema = z.object({
  version: z.string().min(1, "Requerido"),
  content: z.string().min(1, "Requerido"),
})

const checklistCategoryLabel: Record<string, string> = {
  normativa: "Normativa",
  documentacion: "Documentación",
  configuracion: "Configuración",
  capacitacion: "Capacitación",
}

function LegalPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("terminos")

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Cumplimiento Legal</h2>
        <p className="text-sm text-slate-500">Gestión de términos de custodia y checklists legales</p>
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

      {activeTab === "terminos" && <TerminosTab />}
      {activeTab === "checklists" && <ChecklistsTab />}
    </div>
  )
}

function TerminosTab() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: termsData, isLoading } = useQuery({
    queryKey: ["legal", "custody-terms"],
    queryFn: () => legalApi.getCustodyTerms(),
  })

  const createMutation = useMutation({
    mutationFn: legalApi.createCustodyTerms,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal", "custody-terms"] })
      toast.success("Términos de custodia creados")
      setShowCreate(false)
      form.reset()
    },
    onError: () => toast.error("Error al crear términos de custodia"),
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => legalApi.activateCustodyTerms(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal", "custody-terms"] })
      toast.success("Términos activados exitosamente")
    },
    onError: () => toast.error("Error al activar términos"),
  })

  const form = useForm({
    resolver: zodResolver(custodyTermsSchema),
    defaultValues: { version: "", content: "" },
  })

  const terms: CustodyTerms[] = termsData?.data ?? []

  const handleActivate = (id: number, version: string) => {
    if (window.confirm(`¿Activar versión "${version}"? Esto desactivará las demás.`)) {
      activateMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Versiones de Términos de Custodia</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva Versión
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
          className="rounded-lg border bg-white p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Versión</label>
            <input
              {...form.register("version")}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Ej: v2.1"
            />
            {form.formState.errors.version && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.version.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Contenido</label>
            <textarea
              {...form.register("content")}
              rows={5}
              className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              placeholder="Contenido de los términos de custodia..."
            />
            {form.formState.errors.content && (
              <p className="mt-1 text-xs text-red-500">{form.formState.errors.content.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creando..." : "Crear Versión"}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); form.reset() }}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : terms.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay versiones de términos de custodia
        </div>
      ) : (
        <div className="space-y-3">
          {terms.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-lg border bg-white p-4 transition-colors",
                t.is_active && "border-emerald-300 bg-emerald-50/30 shadow-sm",
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
                    )}
                  >
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">Versión {t.version}</p>
                      {t.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle className="h-3 w-3" />
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Creado {formatDate(t.created_at)}
                    </p>
                  </div>
                </div>
                {!t.is_active && (
                  <button
                    onClick={() => handleActivate(t.id, t.version)}
                    disabled={activateMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Activar
                  </button>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500 whitespace-pre-wrap line-clamp-3">
                  {t.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChecklistsTab() {
  const queryClient = useQueryClient()

  const { data: checklistsData, isLoading } = useQuery({
    queryKey: ["legal", "checklists"],
    queryFn: () => legalApi.getChecklists(),
  })

  const itemMutation = useMutation({
    mutationFn: ({
      checklistId,
      itemId,
      isChecked,
    }: {
      checklistId: number
      itemId: number
      isChecked: boolean
    }) => legalApi.updateChecklistItem(checklistId, itemId, isChecked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal", "checklists"] })
    },
    onError: () => toast.error("Error al actualizar item"),
  })

  const completeMutation = useMutation({
    mutationFn: (id: number) => legalApi.completeChecklist(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["legal", "checklists"] })
      toast.success("¡Checklist completado exitosamente!", {
        description: "Se ha generado el certificado de cumplimiento.",
        duration: 5000,
        icon: <Award className="h-4 w-4 text-emerald-500" />,
      })
    },
    onError: () => toast.error("Error al completar checklist"),
  })

  const checklists: LegalChecklist[] = checklistsData?.data ?? []

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">Checklists Legales</h3>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : checklists.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay checklists legales
        </div>
      ) : (
        <div className="space-y-3">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onItemToggle={(itemId, isChecked) =>
                itemMutation.mutate({ checklistId: checklist.id, itemId, isChecked })
              }
              itemPending={itemMutation.isPending}
              onComplete={() => completeMutation.mutate(checklist.id)}
              completing={completeMutation.isPending && completeMutation.variables === checklist.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ChecklistCard({
  checklist,
  onItemToggle,
  itemPending,
  onComplete,
  completing,
}: {
  checklist: LegalChecklist
  onItemToggle: (itemId: number, isChecked: boolean) => void
  itemPending: boolean
  onComplete: () => void
  completing: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [showCertificate, setShowCertificate] = useState(checklist.is_completed)

  const items: LegalChecklistItem[] = checklist.items ?? []
  const allChecked = items.length > 0 && items.every((item) => item.is_checked)
  const checkedCount = items.filter((i) => i.is_checked).length

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "normativa":
        return "bg-blue-100 text-blue-700"
      case "documentacion":
        return "bg-purple-100 text-purple-700"
      case "configuracion":
        return "bg-amber-100 text-amber-700"
      case "capacitacion":
        return "bg-green-100 text-green-700"
      default:
        return "bg-slate-100 text-slate-600"
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-800">{checklist.name}</p>
            {checklist.description && (
              <p className="text-xs text-slate-400">{checklist.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {checkedCount}/{items.length}
          </span>
          {checklist.is_completed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <Award className="h-3 w-3" />
              Completado
            </span>
          ) : allChecked ? (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Pendiente cerrar
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              En progreso
            </span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No hay items en este checklist</p>
          ) : (
            items.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-md px-3 py-2 transition-colors cursor-pointer",
                  item.is_checked ? "bg-emerald-50/50" : "hover:bg-slate-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={item.is_checked}
                  disabled={itemPending || checklist.is_completed}
                  onChange={(e) => onItemToggle(item.id, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "inline-flex rounded px-1.5 py-0.5 text-xs font-medium",
                      categoryColor(item.category),
                    )}
                  >
                    {checklistCategoryLabel[item.category] ?? item.category}
                  </span>
                  <p
                    className={cn(
                      "text-sm mt-1",
                      item.is_checked ? "text-slate-400 line-through" : "text-slate-700",
                    )}
                  >
                    {item.description}
                  </p>
                  {item.checked_at && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verificado: {formatDate(item.checked_at)}
                    </p>
                  )}
                </div>
                {item.is_checked && (
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                )}
              </label>
            ))
          )}

          {!checklist.is_completed && (
            <div className="pt-2">
              <button
                onClick={onComplete}
                disabled={!allChecked || completing}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  allChecked
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  "disabled:opacity-50",
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {completing ? "Completando..." : "Completar Checklist"}
              </button>
              {!allChecked && items.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Todos los items deben estar verificados para completar el checklist
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showCertificate && checklist.is_completed && (
        <div className="border-t border-emerald-200 bg-emerald-50/50 px-4 py-4">
          <div className="rounded-lg border-2 border-emerald-200 bg-white p-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-bold text-emerald-800">Certificado de Cumplimiento</p>
            <p className="text-xs text-emerald-600 mt-1">
              El checklist &quot;{checklist.name}&quot; ha sido completado satisfactoriamente.
            </p>
            {checklist.completed_at && (
              <p className="text-xs text-emerald-500 mt-0.5">
                Fecha: {formatDate(checklist.completed_at)}
              </p>
            )}
            <button
              onClick={() => setShowCertificate(false)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
