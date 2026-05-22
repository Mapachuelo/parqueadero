import { createRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { spacesApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { ParkingSpace } from "@/types"
import {
  Loader2,
  MapPin,
  Car,
  CarFront,
  AlertTriangle,
  XCircle,
  CheckCircle2,
} from "lucide-react"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/espacios",
  component: EspaciosPage,
})

function getOccupancyAlert(occupied: number, total: number) {
  if (total === 0) return null
  const pct = (occupied / total) * 100
  if (pct >= 100) return { level: "full" as const, message: "Parqueadero lleno", color: "red" }
  if (pct >= 95) return { level: "danger" as const, message: "Ocupación crítica (>95%)", color: "red" }
  if (pct >= 90) return { level: "warning" as const, message: "Ocupación alta (>90%)", color: "amber" }
  return null
}

function EspaciosPage() {
  const queryClient = useQueryClient()

  const { data: spacesData, isLoading: spacesLoading } = useQuery({
    queryKey: ["spaces", "list"],
    queryFn: () => spacesApi.list(),
  })

  const { data: occupancyData, isLoading: occupancyLoading } = useQuery({
    queryKey: ["spaces", "occupancy"],
    queryFn: () => spacesApi.occupancy(),
    refetchInterval: 10000,
  })

  const releaseMutation = useMutation({
    mutationFn: (code: string) => spacesApi.release(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces", "list"] })
      queryClient.invalidateQueries({ queryKey: ["spaces", "occupancy"] })
      toast.success("Espacio liberado exitosamente")
    },
    onError: () => toast.error("Error al liberar el espacio"),
  })

  const spaces: ParkingSpace[] = Array.isArray(spacesData?.data) ? spacesData.data : []
  const occupancy = occupancyData?.data
  const occupiedCount = occupancy?.occupied ?? spaces.filter((s) => s.is_occupied).length
  const freeCount = occupancy?.free ?? spaces.filter((s) => !s.is_occupied).length
  const totalCount = occupancy?.total ?? spaces.length
  const occupancyPct = totalCount > 0 ? (occupiedCount / totalCount) * 100 : 0
  const alert = getOccupancyAlert(occupiedCount, totalCount)

  const isLoading = spacesLoading || occupancyLoading

  const handleRelease = (code: string) => {
    if (window.confirm(`¿Liberar el espacio ${code}?`)) {
      releaseMutation.mutate(code)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Gestión de Espacios</h2>
        <p className="text-sm text-slate-500">Administre los espacios del parqueadero</p>
      </div>

      {alert && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3",
            alert.color === "red"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {alert.level === "full"
                ? "¡Parqueadero lleno!"
                : alert.level === "danger"
                  ? "¡Ocupación crítica!"
                  : "¡Alta ocupación!"}
            </p>
            <p className="text-xs opacity-80">{alert.message}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Resumen de Ocupación</h3>
          <span className="text-xs font-medium text-slate-500">
            {totalCount} espacios totales
          </span>
        </div>

        <div className="flex items-end gap-4 mb-2">
          <div>
            <p className="text-xs text-slate-400">Ocupados</p>
            <p className="text-xl font-bold text-red-600">{occupiedCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Libres</p>
            <p className="text-xl font-bold text-emerald-600">{freeCount}</p>
          </div>
          <div className="ml-auto text-right">
            <span
              className={cn(
                "text-lg font-bold",
                occupancyPct >= 95
                  ? "text-red-600"
                  : occupancyPct >= 90
                    ? "text-amber-600"
                    : "text-slate-700",
              )}
            >
              {occupancyPct.toFixed(1)}%
            </span>
            <p className="text-xs text-slate-400">ocupación</p>
          </div>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              occupancyPct >= 95
                ? "bg-red-500"
                : occupancyPct >= 90
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            )}
            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : spaces.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay espacios registrados
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {spaces.map((space) => (
            <div
              key={space.code}
              className={cn(
                "relative flex flex-col items-center rounded-lg border bg-white p-4 transition-colors",
                space.is_occupied
                  ? "border-red-200 bg-red-50/30"
                  : "border-emerald-200 bg-emerald-50/30",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full mb-2",
                  space.is_occupied ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600",
                )}
              >
                {space.is_occupied ? (
                  <Car className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">{space.code}</p>
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                  space.is_occupied
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {space.is_occupied ? "Ocupado" : "Libre"}
              </span>
              {space.is_occupied && (
                <div className="mt-2 w-full text-center">
                  {space.plate && (
                    <p className="text-xs font-mono font-medium text-slate-700 bg-slate-100 rounded px-2 py-0.5">
                      {space.plate}
                    </p>
                  )}
                  <button
                    onClick={() => handleRelease(space.code)}
                    disabled={releaseMutation.isPending}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md bg-red-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Liberar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
