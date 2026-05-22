import { createRoute, Outlet, useNavigate, redirect } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { clearToken, getToken } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Car, LogOut, User } from "lucide-react"
import { toast } from "sonner"
import { Route as rootRoute } from "./__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/_cliente",
  beforeLoad: async () => {
    const token = localStorage.getItem("parqueadero_token")
    if (!token) return

    let redirectNeeded = false
    try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        localStorage.removeItem("parqueadero_token")
        return
      }
      const data = await res.json()
      if (data.user && data.user.role !== "cliente") {
        redirectNeeded = true
      }
    } catch {
      return
    }

    if (redirectNeeded) {
      throw redirect({ to: "/login" })
    }
  },
  component: ClienteLayout,
})

function ClienteLayout() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && user && user.role !== "cliente") {
    clearToken()
    navigate({ to: "/login" })
    return null
  }

  const handleLogout = async () => {
    clearToken()
    toast.success("Sesión cerrada")
    navigate({ to: "/login" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Car className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Parqueadero Neiva</h1>
            <p className="text-[10px] text-muted-foreground">Portal de Clientes</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(user || getToken()) && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {user?.full_name || "Cliente"}
              </span>
            </div>
          )}
          {(user || getToken()) && (
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "text-muted-foreground hover:bg-red-50 hover:text-red-600",
              )}
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
