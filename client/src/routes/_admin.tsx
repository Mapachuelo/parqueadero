import { createRoute, Link, Outlet, useLocation, redirect } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ArrowRightLeft,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Users,
  LogOut,
  Car,
} from "lucide-react"
import { Route as rootRoute } from "./__root"

const sidebarItems = [
  { to: "/_admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/_operator/entrada", icon: ArrowRightLeft, label: "Entrada/Salida" },
  { to: "/_admin/tarifas", icon: DollarSign, label: "Tarifas" },
  { to: "/_admin/reportes", icon: BarChart3, label: "Reportes" },
  { to: "/_admin/reclamos", icon: AlertTriangle, label: "Reclamos" },
  { to: "/_admin/legal", icon: ShieldCheck, label: "Legal" },
  { to: "/_admin/espacios", icon: MapPin, label: "Espacios" },
  { to: "/_admin/usuarios", icon: Users, label: "Usuarios" },
]

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/_admin",
  beforeLoad: async () => {
    const token = localStorage.getItem("parqueadero_token")
    if (!token) {
      throw redirect({ to: "/login" })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user, loading, logout, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    window.location.href = "/login"
    return null
  }

  const isActive = (to: string) => location.pathname.startsWith(to)

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-30">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Parqueadero</h1>
            <p className="text-xs text-slate-400">Panel Administrativo</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.to)
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-700 px-3 py-3">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-900/50 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <div className="ml-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-6">
          <div>
            <p className="text-sm text-slate-500">
              Bienvenido, <span className="font-medium text-slate-700">{user.full_name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {user.role === "admin" ? "Administrador" : user.role}
            </span>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
