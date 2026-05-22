import { createRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { clientApi, setToken, clearToken } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { cn, formatCurrency, formatDate, formatDuration } from "@/lib/utils"
import {
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Download,
  Loader2,
  LogIn,
  Mail,
  User,
} from "lucide-react"
import type { User as UserType, VehicleTransaction } from "@/types"
import { CategoryLabel, PaymentMethodLabel } from "@/types"
import { Route as ClienteLayout } from "./_cliente"

type AuthTab = "email" | "transaction"

export const Route = createRoute({
  getParentRoute: () => ClienteLayout,
  path: "/",
  component: ClienteIndexPage,
})

function ClienteIndexPage() {
  const { user, loading: authLoading } = useAuth()

  const isAlreadyAuth = user && user.role === "cliente"

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isAlreadyAuth) {
    return <TransactionHistory localUser={user} />
  }

  return <ClientAuthForm />
}

function ClientAuthForm() {
  const [tab, setTab] = useState<AuthTab>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [plateLast4, setPlateLast4] = useState("")
  const [authUser, setAuthUser] = useState<UserType | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload =
        tab === "email"
          ? { email, password }
          : { transactionId, plateLast4 }
      const res = await clientApi.auth(payload)
      return res
    },
    onSuccess: (res) => {
      setToken(res.data.token)
      setAuthUser(res.data.user)
      toast.success("Autenticación exitosa")
    },
    onError: (err: unknown) => {
      const e = err as { response?: { status: number; statusText: string }; message?: string }
      if (e.response?.status === 401) {
        toast.error("Credenciales inválidas. Verifique los datos")
      } else if (e.response?.status === 404) {
        toast.error("Transacción no encontrada")
      } else if (e.response?.status === 429) {
        toast.error("Demasiados intentos. Espere un momento")
      } else {
        toast.error("Error de conexión. Verifique el servidor")
      }
    },
  })

  if (authUser) {
    return <TransactionHistory localUser={authUser} />
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg border border-border">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Portal de Clientes</h2>
          <p className="text-sm text-muted-foreground">Consulte su historial de parqueo</p>
        </div>

        <div className="mb-5 flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab("email")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "email"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Mail className="mr-1.5 inline h-3.5 w-3.5" />
            Acceso con Cuenta
          </button>
          <button
            type="button"
            onClick={() => setTab("transaction")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab === "transaction"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Car className="mr-1.5 inline h-3.5 w-3.5" />
            Acceso por Transacción
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "email" ? (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="cliente@ejemplo.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="transactionId" className="block text-sm font-medium text-foreground mb-1">
                  Código de Transacción
                </label>
                <input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  placeholder="TRX-20250001-ABC"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
              <div>
                <label htmlFor="plateLast4" className="block text-sm font-medium text-foreground mb-1">
                  Últimos 4 dígitos de la placa
                </label>
                <input
                  id="plateLast4"
                  type="text"
                  value={plateLast4}
                  onChange={(e) => setPlateLast4(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  required
                  maxLength={4}
                  placeholder="1234"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Ingresar
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Parqueadero Neiva &bull; Consulte su historial de forma segura
        </p>
      </div>
    </div>
  )
}

function TransactionHistory({ localUser }: { localUser: UserType | null }) {
  const { user: authUser } = useAuth()
  const user = localUser || authUser
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})

  const handleApplyFilters = () => {
    const params: Record<string, string> = {}
    if (dateFrom) params.from = dateFrom
    if (dateTo) params.to = dateTo
    setFilters(params)
  }

  const handleClearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setFilters({})
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-transactions", filters],
    queryFn: () => clientApi.getTransactions(filters),
    enabled: !!user,
  })

  const handleLogout = () => {
    clearToken()
    window.location.reload()
  }

  const handleDownloadReceipt = (transaction: VehicleTransaction) => {
    const receiptContent = generateReceiptHTML(transaction)
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(receiptContent)
      win.document.close()
      win.print()
    }
  }

  const transactions = data?.data?.transactions ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Historial de Transacciones</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.full_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {user.full_name}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="dateFrom" className="block text-xs font-medium text-muted-foreground mb-1">
              Desde
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-xs font-medium text-muted-foreground mb-1">
              Hasta
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleApplyFilters}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Filtrar
          </button>
          <button
            onClick={handleClearFilters}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            Limpiar
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            Error al cargar el historial. Verifique su conexión e intente nuevamente.
          </p>
        </div>
      )}

      {!isLoading && !isError && transactions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 text-sm font-medium text-foreground">
            No se encontraron transacciones
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {Object.keys(filters).length > 0
              ? "Ajuste los filtros de fecha para ver más resultados"
              : "Aún no tiene transacciones registradas en el sistema"}
          </p>
        </div>
      )}

      {!isLoading && !isError && transactions.length > 0 && (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              isExpanded={expandedId === tx.id}
              onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
              onDownload={() => handleDownloadReceipt(tx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionCard({
  transaction,
  isExpanded,
  onToggle,
  onDownload,
}: {
  transaction: VehicleTransaction
  isExpanded: boolean
  onToggle: () => void
  onDownload: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-sm">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <div className="min-w-[140px]">
            <p className="text-xs text-muted-foreground">Fecha</p>
            <p className="font-medium text-foreground">
              {formatDate(transaction.entry_time)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Placa</p>
            <p className="font-mono font-medium text-foreground">
              {transaction.plate || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categoría</p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {CategoryLabel[transaction.category]}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Duración</p>
            <p className="font-medium text-foreground">
              {transaction.duration != null ? formatDuration(transaction.duration) : "Activo"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-foreground">
              {transaction.final_amount != null
                ? formatCurrency(transaction.final_amount)
                : transaction.total_amount != null
                  ? formatCurrency(transaction.total_amount)
                  : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Método de pago</p>
            <p className="font-medium text-foreground capitalize">
              {transaction.payment
                ? PaymentMethodLabel[transaction.payment.payment_method] || transaction.payment.payment_method
                : "Pendiente"}
            </p>
          </div>
        </div>
        <div className="ml-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              transaction.status === "completed"
                ? "bg-green-100 text-green-700"
                : transaction.status === "active"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600",
            )}
          >
            {transaction.status === "completed"
              ? "Completado"
              : transaction.status === "active"
                ? "Activo"
                : transaction.status === "cancelled"
                  ? "Cancelado"
                  : transaction.status}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detalles de la Transacción
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Transacción</span>
                  <span className="font-mono font-medium">{transaction.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placa</span>
                  <span className="font-mono font-medium">{transaction.plate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoría</span>
                  <span>{CategoryLabel[transaction.category]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente</span>
                  <span>{transaction.customer_name}</span>
                </div>
                {transaction.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teléfono</span>
                    <span>{transaction.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrada</span>
                  <span>{formatDate(transaction.entry_time)}</span>
                </div>
                {transaction.exit_time && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salida</span>
                    <span>{formatDate(transaction.exit_time)}</span>
                  </div>
                )}
                {transaction.duration != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span>{formatDuration(transaction.duration)}</span>
                  </div>
                )}
                {transaction.billing_mode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modo de cobro</span>
                    <span className="capitalize">{transaction.billing_mode}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {transaction.payment ? "Detalles del Pago" : "Pago"}
              </h4>
              {transaction.payment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Método</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      {PaymentMethodLabel[transaction.payment.payment_method] ||
                        transaction.payment.payment_method}
                    </span>
                  </div>
                  {transaction.total_amount != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(transaction.total_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto pagado</span>
                    <span className="font-semibold">
                      {formatCurrency(transaction.payment.amount_paid)}
                    </span>
                  </div>
                  {transaction.payment.change_amount != null &&
                    transaction.payment.change_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cambio</span>
                        <span>{formatCurrency(transaction.payment.change_amount)}</span>
                      </div>
                    )}
                  {transaction.payment.prepaid_used != null &&
                    transaction.payment.prepaid_used > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saldo usado</span>
                        <span>{formatCurrency(transaction.payment.prepaid_used)}</span>
                      </div>
                    )}
                  {transaction.final_amount != null && (
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-medium">Total final</span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(transaction.final_amount)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Pago pendiente</p>
              )}

              {transaction.operator && (
                <div className="rounded-lg bg-muted/50 p-3 mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Atendido por
                  </h4>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.operator.full_name}
                  </p>
                </div>
              )}

              {transaction.ticket && (
                <div className="rounded-lg bg-muted/50 p-3 mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Ticket / Recibo
                  </h4>
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground">Tipo:</span>{" "}
                    {transaction.ticket.ticket_type === "entry"
                      ? "Entrada"
                      : transaction.ticket.ticket_type === "exit"
                        ? "Salida"
                        : transaction.ticket.ticket_type}
                  </p>
                  {transaction.ticket.ticket_number && (
                    <p className="text-sm text-foreground">
                      <span className="text-muted-foreground">Número:</span>{" "}
                      {transaction.ticket.ticket_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Descargar Recibo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function generateReceiptHTML(tx: VehicleTransaction): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo #${tx.transaction_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 360px;
      margin: 20px auto;
      padding: 20px;
      color: #0f172a;
    }
    .header { text-align: center; margin-bottom: 16px; }
    .header h2 { margin: 0 0 4px 0; font-size: 18px; }
    .header p { margin: 0; font-size: 12px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 6px 4px; border-bottom: 1px solid #e2e8f0; }
    td:first-child { color: #64748b; width: 40%; }
    td:last-child { text-align: right; font-weight: 500; }
    .total { border-top: 2px solid #0f172a; }
    .total td { font-weight: 700; padding-top: 8px; border: none; }
    .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Parqueadero Neiva</h2>
    <p>Recibo de transacción</p>
  </div>
  <table>
    <tr><td>Transacción</td><td>${tx.transaction_id}</td></tr>
    <tr><td>Placa</td><td>${tx.plate || "—"}</td></tr>
    <tr><td>Categoría</td><td>${CategoryLabel[tx.category]}</td></tr>
    <tr><td>Cliente</td><td>${tx.customer_name}</td></tr>
    <tr><td>Entrada</td><td>${formatDate(tx.entry_time)}</td></tr>
    ${tx.exit_time ? `<tr><td>Salida</td><td>${formatDate(tx.exit_time)}</td></tr>` : ""}
    ${tx.duration != null ? `<tr><td>Duración</td><td>${formatDuration(tx.duration)}</td></tr>` : ""}
    ${tx.payment ? `<tr><td>Método</td><td>${PaymentMethodLabel[tx.payment.payment_method] || tx.payment.payment_method}</td></tr>` : ""}
    ${tx.payment ? `<tr><td>Pagado</td><td>${formatCurrency(tx.payment.amount_paid)}</td></tr>` : ""}
    <tr class="total"><td>Total</td><td>${tx.final_amount != null ? formatCurrency(tx.final_amount) : tx.total_amount != null ? formatCurrency(tx.total_amount) : "—"}</td></tr>
  </table>
  <div class="footer">
    <p>Parqueadero Neiva — Ley 1801/2016</p>
    <p>${new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}</p>
  </div>
</body>
</html>`
}
