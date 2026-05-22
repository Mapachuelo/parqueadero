import { createRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { authApi, reportsApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Plus, Loader2, X, UserPlus, ShieldCheck, User, Shield, Check, X as XIcon } from "lucide-react"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/usuarios",
  component: UsuariosPage,
})

const registerSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  fullName: z.string().min(1, "Requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  role: z.enum(["admin", "operador"] as const),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface UserRow {
  id: number
  username: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  entries?: number
  exits?: number
  payments?: number
}

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  operador: "Operador",
}

function UsuariosPage() {
  const queryClient = useQueryClient()
  const [showRegister, setShowRegister] = useState(false)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["reports", "users"],
    queryFn: () => reportsApi.users(),
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authApi.register({
        username: data.username,
        password: data.password,
        full_name: data.fullName,
        email: data.email,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", "users"] })
      toast.success("Usuario registrado exitosamente")
      setShowRegister(false)
      registerForm.reset()
    },
    onError: () => toast.error("Error al registrar usuario"),
  })

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      role: "operador" as const,
    },
  })

  const users: UserRow[] = Array.isArray(usersData?.data)
    ? (usersData.data as UserRow[])
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-500">
            Administre los usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Nuevo Usuario
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border bg-white text-sm text-slate-400">
          No hay usuarios registrados
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="text-slate-600 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-blue-100 text-blue-600",
                        )}
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className="font-mono text-xs font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{u.full_name}</td>
                  <td className="px-4 py-3 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {u.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <ShieldCheck className="h-3 w-3" />
                      )}
                      {roleLabel[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {u.is_active ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <XIcon className="h-3 w-3" />
                      )}
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Registrar Usuario</h3>
              </div>
              <button
                onClick={() => setShowRegister(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}
              className="space-y-3 p-5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre de usuario
                </label>
                <input
                  {...registerForm.register("username")}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="jperez"
                  autoComplete="off"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-xs text-red-500">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre completo
                </label>
                <input
                  {...registerForm.register("fullName")}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Juan Pérez"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {registerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  {...registerForm.register("email")}
                  className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="juan@correo.com"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    {...registerForm.register("password")}
                    className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="••••••"
                    autoComplete="new-password"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rol</label>
                  <select
                    {...registerForm.register("role")}
                    className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {registerMutation.isPending ? "Registrando..." : "Registrar Usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="rounded-lg border px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
