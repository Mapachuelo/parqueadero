import { createRoute } from "@tanstack/react-router"
import { ActivosList } from "@/components/ActivosList"
import { Route as AdminLayout } from "./_admin"

export const Route = createRoute({
  getParentRoute: () => AdminLayout,
  path: "/activos",
  component: ActivosList,
})
