import { createRoute } from "@tanstack/react-router"
import { EntradaForm } from "@/components/EntradaForm"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/entrada",
  component: EntradaForm,
})
