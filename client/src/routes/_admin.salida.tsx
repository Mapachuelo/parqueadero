import { createRoute } from "@tanstack/react-router"
import { SalidaForm } from "@/components/SalidaForm"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/salida",
  component: SalidaForm,
})
