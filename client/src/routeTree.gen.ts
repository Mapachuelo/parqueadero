import { Route as rootRoute } from "@/routes/__root"

// Import all route files so they register via getParentRoute
import { Route as IndexRoute } from "@/routes/index"
import { Route as LoginRoute } from "@/routes/login"
import { Route as OperatorLayout } from "@/routes/_operator"
import { Route as OperatorEntrada } from "@/routes/_operator.entrada"
import { Route as OperatorSalida } from "@/routes/_operator.salida"
import { Route as OperatorActivos } from "@/routes/_operator.activos"
import { Route as AdminLayout } from "@/routes/_admin"
import { Route as AdminDashboard } from "@/routes/_admin.dashboard"
import { Route as AdminTarifas } from "@/routes/_admin.tarifas"
import { Route as AdminReportes } from "@/routes/_admin.reportes"
import { Route as AdminLegal } from "@/routes/_admin.legal"
import { Route as AdminEspacios } from "@/routes/_admin.espacios"
import { Route as AdminReclamos } from "@/routes/_admin.reclamos"
import { Route as AdminUsuarios } from "@/routes/_admin.usuarios"
import { Route as ClienteLayout } from "@/routes/_cliente"
import { Route as ClienteIndex } from "@/routes/_cliente.index"

// Build the tree by explicitly adding children
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const a = (r: any) => r

const oe = a(OperatorEntrada)
const os = a(OperatorSalida)
const oa = a(OperatorActivos)
const opLayout = a(OperatorLayout.addChildren([oe, os, oa]))

const ad = a(AdminDashboard)
const at = a(AdminTarifas)
const ar = a(AdminReportes)
const al = a(AdminLegal)
const ae = a(AdminEspacios)
const acl = a(AdminReclamos)
const au = a(AdminUsuarios)
const admLayout = a(AdminLayout.addChildren([ad, at, ar, al, ae, acl, au]))

const ci = a(ClienteIndex)
const cliLayout = a(ClienteLayout.addChildren([ci]))

export const routeTree = rootRoute.addChildren([
  a(IndexRoute),
  a(LoginRoute),
  opLayout,
  admLayout,
  cliLayout,
] as never)
