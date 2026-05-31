import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"
import { transactionsApi } from "@/lib/api"
import { CategoryLabel } from "@/types"
import { cn, formatDate } from "@/lib/utils"
import { Car, X, Check } from "lucide-react"
import type { VehicleTransaction } from "@/types"

export const entrySchema = z.object({
  plate: z
    .string()
    .min(1, "La placa es requerida")
    .regex(/^[A-Z]{3}-?\d{3}$/, "Formato inválido (AAA-123 o ABC123)"),
  category: z.enum(["A", "B", "C", "D"] as const, { message: "Seleccione una categoría" }),
  customerName: z.string().min(1, "Requerido").max(100, "Máximo 100 caracteres"),
  customerPhone: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  isInternational: z.boolean(),
  countryOrigin: z.string().max(100).optional().or(z.literal("")),
  vehicleDescription: z.string().max(200).optional().or(z.literal("")),
})

export type EntryFormData = z.infer<typeof entrySchema>

function TicketModal({
  transaction,
  onClose,
}: {
  transaction: VehicleTransaction
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            Ticket de entrada
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transacción</span>
            <span className="font-mono font-medium">{transaction.transaction_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placa</span>
            <span className="font-medium">{transaction.plate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoría</span>
            <span className="font-medium">{CategoryLabel[transaction.category]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium">{transaction.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entrada</span>
            <span className="font-medium">{formatDate(transaction.entry_time)}</span>
          </div>
          {transaction.space_assigned && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Espacio</span>
              <span className="font-medium">{transaction.space_assigned}</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

export function EntradaForm() {
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketData, setTicketData] = useState<VehicleTransaction | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EntryFormData>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      plate: "",
      category: undefined,
      customerName: "",
      customerPhone: "",
      isInternational: false,
      countryOrigin: "",
      vehicleDescription: "",
    },
  })

  const isInternational = watch("isInternational")

  const mutation = useMutation({
    mutationFn: (data: EntryFormData) =>
      transactionsApi.entry({
        plate: data.plate,
        category: data.category,
        customerName: data.customerName,
        customerPhone: data.customerPhone || undefined,
        isInternational: data.isInternational,
        countryOrigin: data.countryOrigin || undefined,
        vehicleDescription: data.vehicleDescription || undefined,
      }),
    onSuccess: (response) => {
      toast.success(`Entrada registrada. Transacción: ${response.data.transaction_id}`)
      setTicketData(response.data)
      setShowTicketModal(true)
      reset()
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status: number }; message?: string }
      if (err.response?.status === 409) {
        toast.error("El vehículo ya se encuentra en el parqueadero")
      } else if (err.response?.status === 400) {
        toast.error("Datos inválidos. Verifique el formulario")
      } else {
        toast.error("Error al registrar la entrada")
      }
    },
  })

  const onSubmit = (data: EntryFormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Registrar Entrada</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ingrese los datos del vehículo que ingresa al parqueadero
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Datos del vehículo</h3>

          <div>
            <label htmlFor="plate" className="block text-sm font-medium text-foreground mb-1">
              Placa
            </label>
            <input
              id="plate"
              {...register("plate")}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                e.target.value = value
                register("plate").onChange(e)
              }}
              placeholder="AAA-123"
              maxLength={7}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            {errors.plate && (
              <p className="text-xs text-destructive mt-1">{errors.plate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
              Categoría
            </label>
            <select
              id="category"
              {...register("category")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Seleccione categoría</option>
              {Object.entries(CategoryLabel).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isInternational"
              type="checkbox"
              {...register("isInternational")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isInternational" className="text-sm font-medium text-foreground">
              Placa internacional
            </label>
          </div>

          {isInternational && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <div>
                <label
                  htmlFor="countryOrigin"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  País de origen
                </label>
                <input
                  id="countryOrigin"
                  {...register("countryOrigin")}
                  placeholder="Ej: Venezuela"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="vehicleDescription"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Descripción del vehículo
                </label>
                <input
                  id="vehicleDescription"
                  {...register("vehicleDescription")}
                  placeholder="Marca, modelo, color"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Datos del propietario/conductor
          </h3>

          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Nombre completo
            </label>
            <input
              id="customerName"
              {...register("customerName")}
              placeholder="Nombre del propietario o conductor"
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.customerName && (
              <p className="text-xs text-destructive mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="customerPhone"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
            </label>
            <input
              id="customerPhone"
              {...register("customerPhone")}
              placeholder="300 123 4567"
              maxLength={20}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.customerPhone && (
              <p className="text-xs text-destructive mt-1">{errors.customerPhone.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Registrando...
            </>
          ) : (
            <>
              <Car className="h-4 w-4" />
              Registrar entrada
            </>
          )}
        </button>
      </form>

      {showTicketModal && ticketData && (
        <TicketModal
          transaction={ticketData}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  )
}
