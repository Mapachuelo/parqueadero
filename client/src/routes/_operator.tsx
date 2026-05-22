import { createRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { Car, ArrowRightLeft, List, LogOut, User } from "lucide-react"
import { Route as rootRoute } from "./__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/_operator",
  component: OperatorLayout,
})

function OperatorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const navItems = [
    { to: "/_operator/entrada", icon: Car, label: "Entrada" },
    { to: "/_operator/salida", icon: ArrowRightLeft, label: "Salida" },
    { to: "/_operator/activos", icon: List, label: "Activos" },
  ]

  const handleLogout = async () => {
    await logout()
    navigate({ to: "/login" })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-slate-900 text-white min-h-screen fixed inset-y-0 left-0 z-30 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Parqueadero
          </h1>
          <p className="text-xs text-slate-400 mt-1">Neiva, Colombia</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-64">
        <header className="h-14 border-b bg-white flex items-center justify-between px-4 fixed top-0 right-0 left-64 z-20">
          <span className="text-sm text-muted-foreground">
            Sistema de gestión de parqueadero
          </span>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">{user?.full_name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">
              {user?.role}
            </span>
          </div>
        </header>

        <main className="p-6 mt-14">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
