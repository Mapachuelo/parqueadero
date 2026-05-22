import { createRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useAuth } from "@/lib/auth"
import { Car } from "lucide-react"
import { Route as rootRoute } from "./__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
})

function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (user) {
    if (user.role === "admin") navigate({ to: "/_admin/dashboard" })
    else if (user.role === "operador") navigate({ to: "/_operator/entrada" })
    else navigate({ to: "/_cliente/historial" })
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.user.role === "admin") navigate({ to: "/_admin/dashboard" })
      else if (res.user.role === "operador") navigate({ to: "/_operator/entrada" })
      else navigate({ to: "/_cliente/historial" })
    } catch (err: unknown) {
      const e = err as { response?: { status: number; statusText: string }; message?: string }
      if (e.response?.status === 401) setError("Usuario o contraseña incorrectos")
      else if (e.response?.status === 423) setError("Cuenta bloqueada. Intente más tarde")
      else setError("Error de conexión. Verifique el servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Car className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Parqueadero Neiva</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="admin"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Neiva, Colombia &bull; Ley 1801/2016
        </p>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-medium mb-1">Credenciales de prueba:</p>
          <p>Admin: <code className="bg-slate-200 px-1 rounded">admin</code> / <code className="bg-slate-200 px-1 rounded">Admin123!</code></p>
          <p>Operador: <code className="bg-slate-200 px-1 rounded">operador</code> / <code className="bg-slate-200 px-1 rounded">Operador123!</code></p>
        </div>
      </div>
    </div>
  )
}
