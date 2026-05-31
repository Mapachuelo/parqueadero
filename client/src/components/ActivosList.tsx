import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { transactionsApi } from "@/lib/api"
import { formatDate, formatDuration } from "@/lib/utils"
import { CategoryLabel } from "@/types"
import { Search, Car, Clock, User } from "lucide-react"

export function ActivosList() {
  const [search, setSearch] = useState("")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["transactions", "active"],
    queryFn: () => transactionsApi.active(1, 100),
    refetchInterval: 30_000,
  })

  const transactions = data?.data?.transactions ?? []
  const total = data?.data?.total ?? 0

  const filtered = search.trim()
    ? transactions.filter((t) =>
        t.plate?.toUpperCase().includes(search.trim().toUpperCase()),
      )
    : transactions

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Vehículos activos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {total} vehículo{total !== 1 ? "s" : ""} actualmente en el parqueadero
        </p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por placa..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-3">
          <span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Cargando vehículos...</p>
        </div>
      ) : isError ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-destructive font-medium">Error al cargar los vehículos</p>
          <p className="text-sm text-muted-foreground mt-1">Intente recargar la página</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 flex flex-col items-center justify-center gap-3">
          <Car className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? "No se encontraron vehículos con esa placa"
              : "No hay vehículos activos en este momento"}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Placa
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Categoría
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Hora entrada
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Duración
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Espacio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{t.plate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                        {CategoryLabel[t.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{t.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(t.entry_time)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {t.duration != null ? formatDuration(t.duration) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        {t.space_assigned ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((t) => (
              <div key={t.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-foreground">{t.plate}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                    {CategoryLabel[t.category]}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {t.customer_name}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(t.entry_time)}
                  </div>
                  <div className="font-medium">
                    {t.duration != null ? formatDuration(t.duration) : "—"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  Espacio: {t.space_assigned ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
