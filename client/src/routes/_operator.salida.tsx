import { createRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { transactionsApi, paymentsApi } from "@/lib/api"
import { formatCurrency, formatDate, formatDuration, cn } from "@/lib/utils"
import { CategoryLabel, PaymentMethodLabel } from "@/types"
import type { VehicleTransaction, Payment, PaymentMethod } from "@/types"
import {
  Search,
  ArrowRightLeft,
  Clock,
  User,
  Car,
  CreditCard,
  Check,
  ArrowLeft,
  Hash,
  Banknote,
} from "lucide-react"
import { Route as OperatorLayout } from "./_operator"

type Step = "search" | "payment" | "receipt"

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito", icon: CreditCard },
  { value: "tarjeta_debito", label: "Tarjeta de Débito", icon: CreditCard },
  { value: "transferencia", label: "Transferencia", icon: ArrowRightLeft },
  { value: "billetera_digital", label: "Billetera Digital", icon: CreditCard },
]

export const Route = createRoute({
  getParentRoute: () => OperatorLayout,
  path: "/salida",
  component: SalidaPage,
})

function SalidaPage() {
  const [step, setStep] = useState<Step>("search")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<VehicleTransaction | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo")
  const [amountReceived, setAmountReceived] = useState("")
  const [paymentResult, setPaymentResult] = useState<Payment | null>(null)
  const queryClient = useQueryClient()

  const { data: activeData, isLoading: loadingActive } = useQuery({
    queryKey: ["transactions", "active"],
    queryFn: () => transactionsApi.active(1, 100),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim().toUpperCase()

    if (!query) {
      toast.error("Ingrese una placa o ID de transacción")
      return
    }

    if (!activeData?.data?.transactions) {
      toast.error("No se pudieron cargar los vehículos activos")
      return
    }

    const found = activeData.data.transactions.find(
      (t) =>
        t.plate?.toUpperCase() === query ||
        t.transaction_id === query,
    )

    if (!found) {
      toast.error("No se encontró un vehículo activo con esos datos")
      return
    }

    setSelectedTransaction(found)
    setStep("payment")
  }

  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ["transactions", selectedTransaction?.id],
    queryFn: () =>
      selectedTransaction
        ? transactionsApi.getById(String(selectedTransaction.id))
        : Promise.resolve(null),
    enabled: !!selectedTransaction && step === "payment",
  })

  const paymentMutation = useMutation({
    mutationFn: (data: { transactionId: string; paymentMethod: string; amountPaid: number }) =>
      paymentsApi.process(data),
    onSuccess: (response) => {
      toast.success("Pago procesado exitosamente")
      setPaymentResult(response.data)
      setStep("receipt")
      queryClient.invalidateQueries({ queryKey: ["transactions", "active"] })
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status: number }; message?: string }
      if (err.response?.status === 400) {
        toast.error("Datos de pago inválidos")
      } else if (err.response?.status === 404) {
        toast.error("Transacción no encontrada")
      } else {
        toast.error("Error al procesar el pago")
      }
    },
  })

  const transaction = detailData?.data ?? selectedTransaction
  const finalAmount = transaction?.final_amount ?? transaction?.total_amount ?? 0
  const totalAmount = transaction?.total_amount ?? 0
  const amountReceivedNum = parseFloat(amountReceived) || 0
  const change = paymentMethod === "efectivo" ? Math.max(0, amountReceivedNum - finalAmount) : 0
  const isValidPayment =
    paymentMethod !== "efectivo" || (amountReceivedNum >= finalAmount && amountReceivedNum > 0)

  const handleProcessPayment = () => {
    if (!selectedTransaction) return

    const amountPaid = paymentMethod === "efectivo" ? amountReceivedNum : finalAmount

    paymentMutation.mutate({
      transactionId: selectedTransaction.transaction_id,
      paymentMethod,
      amountPaid,
    })
  }

  const handleNewSearch = () => {
    setStep("search")
    setSearchQuery("")
    setSelectedTransaction(null)
    setPaymentMethod("efectivo")
    setAmountReceived("")
    setPaymentResult(null)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Registrar Salida</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Busque el vehículo y procese el pago para registrar la salida
        </p>
      </div>

      {step !== "search" && (
        <button
          onClick={step === "receipt" ? handleNewSearch : () => setStep("search")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          {step === "receipt" ? "Nueva salida" : "Volver a buscar"}
        </button>
      )}

      {step === "search" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Buscar vehículo</h3>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Placa (AAA-123) o ID de transacción"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loadingActive}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingActive ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </button>
          </form>

          <div className="mt-4 text-xs text-muted-foreground">
            {activeData?.data?.total ?? 0} vehículos activos en el parqueadero
          </div>
        </div>
      )}

      {step === "payment" && transaction && (
        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              Datos del vehículo
            </h3>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-4">
                <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Placa</span>
                  <p className="font-medium">{transaction.plate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoría</span>
                  <p className="font-medium">{CategoryLabel[transaction.category]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hora de entrada
                  </span>
                  <p className="font-medium">{formatDate(transaction.entry_time)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duración</span>
                  <p className="font-medium">
                    {transaction.duration != null
                      ? formatDuration(transaction.duration)
                      : "Calculando..."}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Cliente
                  </span>
                  <p className="font-medium">{transaction.customer_name}</p>
                </div>
                {transaction.space_assigned && (
                  <div>
                    <span className="text-muted-foreground">Espacio</span>
                    <p className="font-medium">{transaction.space_assigned}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Pago
            </h3>

            <div className="border border-border rounded-lg divide-y divide-border">
              {totalAmount !== finalAmount && totalAmount > 0 && (
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              )}
              {totalAmount !== finalAmount && (
                <div className="flex justify-between px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-success">
                    -{formatCurrency(totalAmount - finalAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between px-3 py-2.5 text-sm font-semibold">
                <span>Total a pagar</span>
                <span className="text-lg">{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left",
                      paymentMethod === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "efectivo" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Monto recibido
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="100"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {amountReceivedNum >= finalAmount && finalAmount > 0 && (
                  <div className="bg-success/10 rounded-lg px-3 py-2 flex justify-between text-sm">
                    <span className="text-success font-medium">Cambio</span>
                    <span className="text-success font-bold">{formatCurrency(change)}</span>
                  </div>
                )}
                {amountReceivedNum > 0 && amountReceivedNum < finalAmount && (
                  <div className="bg-destructive/10 rounded-lg px-3 py-2 text-sm">
                    <span className="text-destructive font-medium">
                      Monto insuficiente. Faltan {formatCurrency(finalAmount - amountReceivedNum)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={paymentMutation.isPending || loadingDetail || !isValidPayment}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paymentMutation.isPending ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Pagar {formatCurrency(finalAmount)}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === "receipt" && paymentResult && transaction && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mb-3">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Salida registrada</h3>
            <p className="text-sm text-muted-foreground">Pago procesado exitosamente</p>
          </div>

          <div className="border border-border rounded-lg divide-y divide-border text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Transacción
              </span>
              <span className="font-mono font-medium">{transaction.transaction_id}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <Car className="h-3 w-3" />
                Placa
              </span>
              <span className="font-medium">{transaction.plate}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Cliente
              </span>
              <span className="font-medium">{transaction.customer_name}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Categoría</span>
              <span className="font-medium">{CategoryLabel[transaction.category]}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Entrada</span>
              <span className="font-medium">{formatDate(transaction.entry_time)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Duración</span>
              <span className="font-medium">
                {transaction.duration != null ? formatDuration(transaction.duration) : "—"}
              </span>
            </div>
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Método de pago</span>
              <span className="font-medium">{PaymentMethodLabel[paymentResult.payment_method]}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 font-semibold">
              <span>Total pagado</span>
              <span>{formatCurrency(paymentResult.amount_paid)}</span>
            </div>
            {paymentResult.change_amount != null && paymentResult.change_amount > 0 && (
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-muted-foreground">Cambio</span>
                <span className="text-success font-medium">
                  {formatCurrency(paymentResult.change_amount)}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleNewSearch}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Nueva salida
          </button>
        </div>
      )}
    </div>
  )
}
