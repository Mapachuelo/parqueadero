#!/usr/bin/env python3
"""Genera los mockups/wireframes de la interfaz en draw.io y SVG."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drawio_lib import Diagram  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "diseno", "mockups")

W, H = 1160, 780
BG = "#e5e7eb"
PAGE = "#ffffff"
DARK = "#1f2937"
SIDEBAR = "#111827"
PRIMARY = "#2563eb"
LIGHT = "#f3f4f6"
BORDER = "#9ca3af"


def frame(title):
    d = Diagram(title, W, H, bg=BG)
    d.box(20, 20, W - 40, H - 40, "", kind="rect", fill=PAGE, stroke=BORDER)
    d.box(20, 20, W - 40, 46, "", kind="rect", fill=DARK, stroke=DARK)
    d.box(34, 33, 14, 14, "", kind="ellipse", fill="#ef4444", stroke="#ef4444")
    d.box(54, 33, 14, 14, "", kind="ellipse", fill="#f59e0b", stroke="#f59e0b")
    d.box(74, 33, 14, 14, "", kind="ellipse", fill="#10b981", stroke="#10b981")
    d.box(120, 26, W - 300, 34, title, kind="rect", fill=DARK, stroke=DARK, color="#ffffff", font=13, bold=True)
    return d


def sidebar(d, active, operator=False):
    d.box(20, 66, 210, H - 86, "", kind="rect", fill=SIDEBAR, stroke=SIDEBAR)
    d.box(36, 84, 178, 40, "Parqueadero\nNeiva, Colombia", kind="rect", fill=SIDEBAR, stroke=SIDEBAR,
          color="#ffffff", font=12, bold=True, align="left")
    if operator:
        items = ["Entrada", "Salida", "Activos"]
    else:
        items = ["Dashboard", "Tarifas", "Reportes", "Reclamos", "Legal", "Espacios", "Usuarios",
                 "Entrada/Salida", "Entrada", "Salida", "Activos"]
    y = 150
    for it in items:
        fill = PRIMARY if it == active else SIDEBAR
        d.box(32, y, 186, 34, it, kind="rounded", fill=fill, stroke=fill,
              color="#ffffff" if it == active else "#cbd5e1", font=11, align="left")
        y += 44


def header(d, text, role):
    d.box(230, 66, W - 250, 50, text, kind="rect", fill="#ffffff", stroke="#e5e7eb", font=12, align="left")
    d.box(W - 210, 76, 170, 30, role, kind="rounded", fill="#e0e7ff", stroke="#c7d2fe", font=11)


def content(d, x=250, y=136):
    d.box(x, y, W - x - 30, H - y - 30, "", kind="rect", fill="#f9fafb", stroke="#e5e7eb")


def title(d, text, sub, x=270, y=155):
    d.box(x, y, 700, 34, text, kind="rect", fill="#f9fafb", stroke="#f9fafb", font=15, bold=True, align="left")
    d.box(x, y + 32, 700, 24, sub, kind="rect", fill="#f9fafb", stroke="#f9fafb", font=11, color="#6b7280", align="left")


def card(d, x, y, w, h, heading=None):
    d.box(x, y, w, h, "", kind="rounded", fill="#ffffff", stroke="#e5e7eb")
    if heading:
        d.box(x + 14, y + 10, w - 28, 22, heading, kind="rect", fill="#ffffff", stroke="#ffffff",
              font=12, bold=True, align="left")


def field(d, x, y, w, label, placeholder=""):
    d.box(x, y, w, 18, label, kind="rect", fill="#ffffff", stroke="#ffffff", font=11, color="#374151", align="left")
    d.box(x, y + 18, w, 34, placeholder, kind="input", fill="#ffffff", stroke=BORDER, font=11, color="#9ca3af")


def button(d, x, y, w, h, label, fill=PRIMARY):
    d.box(x, y, w, h, label, kind="rounded", fill=fill, stroke=fill, color="#ffffff", font=12, bold=True)


def stat(d, x, y, label, value, hint, w=200):
    d.box(x, y, w, 100, "", kind="rounded", fill="#ffffff", stroke="#e5e7eb")
    d.box(x + 14, y + 12, w - 24, 20, label, kind="rect", fill="#ffffff", stroke="#ffffff", font=11, color="#6b7280", align="left")
    d.box(x + 14, y + 32, w - 24, 30, value, kind="rect", fill="#ffffff", stroke="#ffffff", font=18, bold=True, align="left")
    d.box(x + 14, y + 66, w - 24, 20, hint, kind="rect", fill="#ffffff", stroke="#ffffff", font=10, color="#9ca3af", align="left")


def table(d, x, y, w, cols, rows, row_h=30):
    col_w = w / len(cols)
    for i, c in enumerate(cols):
        d.box(x + i * col_w, y, col_w, 28, c, kind="rect", fill=LIGHT, stroke="#e5e7eb", font=11, bold=True, align="left")
    for r, row in enumerate(rows):
        for i, cell in enumerate(row):
            d.box(x + i * col_w, y + 28 + r * row_h, col_w, row_h, cell, kind="rect",
                  fill="#ffffff", stroke="#f3f4f6", font=10, align="left")


def mock_login():
    d = frame("Parqueadero Neiva - Inicio de sesion")
    d.box(400, 160, 360, 420, "", kind="rounded", fill="#ffffff", stroke="#e5e7eb")
    d.box(545, 190, 70, 70, "logo", kind="ellipse", fill=PRIMARY, stroke=PRIMARY, color="#ffffff", font=11)
    d.box(430, 280, 300, 30, "Parqueadero Neiva", kind="rect", fill="#ffffff", stroke="#ffffff", font=16, bold=True)
    d.box(430, 308, 300, 20, "Sistema de Gestion", kind="rect", fill="#ffffff", stroke="#ffffff", font=11, color="#6b7280")
    field(d, 430, 350, 300, "Usuario", "Usuario")
    field(d, 430, 412, 300, "Contrasena", "********")
    button(d, 430, 490, 300, 40, "Ingresar")
    d.box(430, 545, 300, 20, "Neiva, Colombia - Ley 1801/2016", kind="rect", fill="#ffffff", stroke="#ffffff", font=10, color="#9ca3af")
    d.save(OUT, "01-login")


def mock_dashboard():
    d = frame("Admin - Dashboard")
    sidebar(d, "Dashboard")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Dashboard", "Resumen general del parqueadero")
    stat(d, 270, 230, "Ocupacion actual", "35.0%", "35 de 100 espacios")
    stat(d, 487, 230, "Ingresos del dia", "$ 450.000", "Periodo: hoy")
    stat(d, 704, 230, "Transacciones activas", "35", "Vehiculos en el parqueadero")
    stat(d, 921, 230, "Espacios libres", "65", "100 espacios totales")
    card(d, 270, 360, 440, 300, "Ocupacion")
    d.box(290, 410, 400, 220, "grafica de linea (historico por hora)", kind="rect", fill=LIGHT, stroke="#d1d5db", font=11, color="#6b7280")
    card(d, 730, 360, 400, 300, "Ingresos por categoria")
    d.box(750, 410, 360, 220, "grafica de barras (A, B, C, D)", kind="rect", fill=LIGHT, stroke="#d1d5db", font=11, color="#6b7280")
    d.save(OUT, "02-dashboard")


def mock_entrada():
    d = frame("Operador - Registrar entrada")
    sidebar(d, "Entrada", operator=True)
    header(d, "Sistema de gestion de parqueadero", "Operador")
    content(d)
    title(d, "Registrar Entrada", "Ingrese los datos del vehiculo que ingresa")
    card(d, 270, 220, 500, 210, "Datos del vehiculo")
    field(d, 290, 260, 200, "Placa", "ABC-123")
    field(d, 510, 260, 240, "Categoria", "Liviano (A)")
    d.box(290, 340, 220, 30, "Placa internacional", kind="rect", fill="#ffffff", stroke="#ffffff", font=11, align="left")
    d.box(290, 366, 16, 16, "", kind="rect", fill="#ffffff", stroke=BORDER)
    card(d, 270, 450, 500, 210, "Datos del propietario/conductor")
    field(d, 290, 490, 460, "Nombre completo", "Nombre del propietario")
    field(d, 290, 552, 460, "Correo electronico (opcional)", "cliente@correo.com")
    button(d, 270, 690, 500, 40, "Registrar entrada")
    card(d, 800, 260, 330, 330, "Ticket de entrada")
    rows = ["Transaccion: TXN-20260927-00001", "Placa: ABC-123", "Categoria: Liviano (A)",
            "Cliente: Cliente Prueba", "Entrada: 27/09/2026, 5:57 p.m.", "Espacio: A-001"]
    for i, r in enumerate(rows):
        d.box(816, 305 + i * 38, 298, 30, r, kind="rect", fill="#ffffff", stroke="#f3f4f6", font=11, align="left")
    button(d, 816, 545, 298, 34, "Aceptar")
    d.save(OUT, "03-entrada")


def mock_salida():
    d = frame("Operador - Registrar salida y pago")
    sidebar(d, "Salida", operator=True)
    header(d, "Sistema de gestion de parqueadero", "Operador")
    content(d)
    title(d, "Registrar Salida", "Busque el vehiculo y procese el pago")
    card(d, 270, 220, 420, 100, "Buscar vehiculo")
    d.box(290, 255, 280, 34, "ABC-123", kind="input", fill="#ffffff", stroke=BORDER, font=11, align="left")
    button(d, 580, 255, 90, 34, "Buscar")
    card(d, 270, 340, 420, 230, "Datos del vehiculo")
    datos = ["Placa: ABC-123", "Categoria: Liviano (A)", "Entrada: 27/09/2026, 4:03 p.m.",
             "Duracion: 2h 0min", "Cliente: Cliente Prueba", "Espacio: A-001"]
    for i, r in enumerate(datos):
        d.box(286, 380 + i * 28, 388, 22, r, kind="rect", fill="#ffffff", stroke="#f3f4f6", font=10, align="left")
    card(d, 710, 220, 420, 430, "Pago")
    d.box(726, 260, 388, 50, "Total a pagar: $ 10.000", kind="rounded", fill="#eff6ff", stroke="#bfdbfe", font=14, bold=True)
    d.box(726, 322, 388, 24, "Metodo de pago", kind="rect", fill="#ffffff", stroke="#ffffff", font=11, bold=True, align="left")
    metodos = ["Efectivo", "Tarjeta credito", "Tarjeta debito", "Transferencia", "Billetera digital"]
    for i, m in enumerate(metodos):
        d.box(726 + (i % 2) * 198, 350 + (i // 2) * 42, 190, 36, m, kind="rounded",
              fill="#eff6ff" if i == 0 else "#ffffff", stroke=PRIMARY if i == 0 else BORDER, font=10)
    field(d, 726, 485, 388, "Monto recibido", "20.000")
    d.box(726, 540, 388, 26, "Cambio: $ 10.000", kind="rounded", fill="#ecfdf5", stroke="#a7f3d0", font=11)
    button(d, 726, 585, 388, 40, "Pagar $ 10.000")
    d.save(OUT, "04-salida-pago")


def mock_recibo():
    d = frame("Operador - Recibo de salida")
    sidebar(d, "Salida", operator=True)
    header(d, "Sistema de gestion de parqueadero", "Operador")
    content(d)
    title(d, "Registrar Salida", "Pago procesado exitosamente")
    card(d, 270, 210, 460, 480)
    d.box(455, 235, 90, 90, "OK", kind="ellipse", fill="#ecfdf5", stroke="#10b981", color="#059669", font=18, bold=True)
    d.box(310, 340, 380, 30, "Salida registrada", kind="rect", fill="#ffffff", stroke="#ffffff", font=16, bold=True)
    rows = ["Transaccion: TXN-20260927-00001", "Placa: ABC-123", "Cliente: Cliente Prueba",
            "Categoria: Liviano (A)", "Entrada: 27/09/2026, 4:03 p.m.", "Duracion: 2h 0min",
            "Metodo de pago: Efectivo", "Total pagado: $ 20.000", "Cambio: $ 10.000"]
    for i, r in enumerate(rows):
        fill = "#eff6ff" if i >= 7 else "#ffffff"
        d.box(290, 385 + i * 32, 420, 30, r, kind="rect", fill=fill, stroke="#f3f4f6", font=11, align="left")
    button(d, 290, 675, 420, 36, "Nueva salida")
    d.save(OUT, "05-recibo")


def mock_activos():
    d = frame("Operador - Vehiculos activos")
    sidebar(d, "Activos", operator=True)
    header(d, "Sistema de gestion de parqueadero", "Operador")
    content(d)
    title(d, "Vehiculos activos", "35 vehiculos actualmente en el parqueadero")
    d.box(270, 220, 300, 36, "Buscar por placa...", kind="input", fill="#ffffff", stroke=BORDER, font=11, align="left")
    table(d, 270, 280, 870,
          ["Placa", "Categoria", "Cliente", "Hora entrada", "Duracion", "Espacio"],
          [["ABC-123", "Liviano (A)", "Cliente Prueba", "27/09/2026, 4:03 p.m.", "2h 0min", "A-001"],
           ["XYZ-987", "Motocicleta (D)", "Maria Gomez", "27/09/2026, 4:30 p.m.", "1h 33min", "A-002"],
           ["QWE-456", "Medio (B)", "Carlos Ruiz", "27/09/2026, 5:10 p.m.", "53min", "A-003"]])
    d.save(OUT, "06-activos")


def mock_tarifas():
    d = frame("Admin - Gestion de tarifas")
    sidebar(d, "Tarifas")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Gestion de Tarifas", "Estructuras, fracciones, mensualidades y abonos")
    tabs = ["Por Hora", "Fracciones", "Mensualidades", "Abonos"]
    for i, t in enumerate(tabs):
        d.box(270 + i * 150, 220, 140, 34, t, kind="rounded", fill=PRIMARY if i == 0 else "#ffffff",
              stroke=PRIMARY if i == 0 else BORDER, color="#ffffff" if i == 0 else "#374151", font=11)
    card(d, 270, 280, 280, 200, "Estructuras tarifarias")
    d.box(286, 320, 248, 60, "Estructura Base v1.0\nActivo", kind="rounded", fill="#eff6ff", stroke=PRIMARY, font=11)
    button(d, 286, 400, 248, 34, "Nueva Estructura")
    card(d, 580, 280, 560, 260, "Tarifas por categoria")
    table(d, 596, 320, 528, ["Categoria", "Precio/Hora", "Descripcion"],
          [["Liviano (A)", "$ 5.000", "-"], ["Medio (B)", "$ 8.000", "-"],
           ["Pesado (C)", "$ 12.000", "-"], ["Motocicleta (D)", "$ 3.000", "-"]])
    button(d, 1010, 320, 100, 30, "Agregar")
    d.save(OUT, "07-tarifas")


def mock_reportes():
    d = frame("Admin - Reportes")
    sidebar(d, "Reportes")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Reportes", "Genere y visualice reportes del sistema")
    field(d, 270, 215, 150, "Desde", "2026-09-27")
    field(d, 440, 215, 150, "Hasta", "2026-09-27")
    tabs = ["Ocupacion", "Ingresos", "Transacciones", "Usuarios", "Compliance"]
    for i, t in enumerate(tabs):
        d.box(270 + i * 140, 290, 130, 32, t, kind="rounded", fill=PRIMARY if i == 1 else "#ffffff",
              stroke=PRIMARY if i == 1 else BORDER, color="#ffffff" if i == 1 else "#374151", font=10)
    stat(d, 270, 345, "Total bruto", "$ 450.000", "Periodo seleccionado")
    stat(d, 495, 345, "Descuentos", "$ 0", "Sin descuentos")
    stat(d, 720, 345, "Neto", "$ 450.000", "Total - descuentos")
    card(d, 270, 470, 420, 240, "Ingresos por categoria")
    d.box(290, 515, 380, 170, "grafica de barras", kind="rect", fill=LIGHT, stroke="#d1d5db", font=11, color="#6b7280")
    card(d, 710, 470, 430, 240, "Ingresos por medio de pago")
    table(d, 726, 515, 398, ["Metodo", "Transacciones", "Total"],
          [["Efectivo", "3", "$ 450.000"], ["Tarjeta", "0", "$ 0"], ["Transferencia", "0", "$ 0"]])
    d.save(OUT, "08-reportes")


def mock_reclamos():
    d = frame("Admin - Reclamos")
    sidebar(d, "Reclamos")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Gestion de Reclamos", "Administre reclamos, quejas y compensaciones")
    d.box(270, 220, 180, 32, "Todos los estados", kind="input", fill="#ffffff", stroke=BORDER, font=11, align="left")
    d.box(465, 220, 180, 32, "Todas las categorias", kind="input", fill="#ffffff", stroke=BORDER, font=11, align="left")
    card(d, 270, 280, 870, 120)
    d.box(290, 300, 300, 26, "CLM-20260927-00001  Cobro Incorrecto  Abierto", kind="rect",
          fill="#ffffff", stroke="#ffffff", font=12, bold=True, align="left")
    d.box(290, 330, 820, 22, "Reclamo de prueba por cobro incorrecto - 27/09/2026", kind="rect",
          fill="#ffffff", stroke="#ffffff", font=10, color="#6b7280", align="left")
    card(d, 270, 420, 870, 250)
    d.box(290, 440, 300, 24, "Notas (1)", kind="rect", fill="#ffffff", stroke="#ffffff", font=12, bold=True, align="left")
    d.box(290, 470, 820, 40, "Sistema - 27/09/2026 6:15 p.m.  Nota E2E de seguimiento", kind="rounded",
          fill=LIGHT, stroke="#e5e7eb", font=10, align="left")
    field(d, 290, 525, 560, "Agregar nota...", "Escriba una nota")
    button(d, 865, 543, 80, 34, "Agregar")
    d.box(290, 590, 260, 24, "Resolver Reclamo", kind="rect", fill="#ffffff", stroke="#ffffff", font=12, bold=True, align="left")
    field(d, 290, 615, 560, "Resolucion", "Describa la resolucion")
    button(d, 865, 633, 200, 34, "Resolver Reclamo")
    d.save(OUT, "09-reclamos")


def mock_legal():
    d = frame("Admin - Cumplimiento legal")
    sidebar(d, "Legal")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Cumplimiento Legal", "Terminos de custodia y checklists legales")
    d.box(270, 220, 180, 34, "Terminos de Custodia", kind="rounded", fill=PRIMARY, stroke=PRIMARY, color="#ffffff", font=11)
    d.box(460, 220, 140, 34, "Checklists", kind="rounded", fill="#ffffff", stroke=BORDER, font=11)
    card(d, 270, 280, 870, 150, "Versiones de terminos de custodia")
    d.box(290, 320, 300, 40, "Version 1.0  Activo", kind="rounded", fill="#ecfdf5", stroke="#10b981", font=12, bold=True)
    button(d, 1000, 320, 120, 34, "Nueva Version")
    d.box(290, 375, 820, 40, "Texto legal vigente (Ley 1801/2016, Ley 1480/2011): terminos y condiciones de custodia...",
          kind="rect", fill=LIGHT, stroke="#e5e7eb", font=10, color="#6b7280", align="left")
    card(d, 270, 450, 870, 220, "Checklist legal de pre-operacion")
    items = ["Ley 1801/2016 y Ley 1480/2011 revisadas", "Terminos de custodia redactados y aprobados",
             "Tarifas configuradas y aprobadas", "Roles y permisos asignados", "Operadores capacitados"]
    for i, it in enumerate(items):
        d.box(290, 490 + i * 34, 18, 18, "", kind="rect", fill="#ffffff", stroke=BORDER)
        d.box(316, 490 + i * 34, 600, 20, it, kind="rect", fill="#ffffff", stroke="#ffffff", font=11, align="left")
    button(d, 900, 630, 220, 34, "Completar Checklist")
    d.save(OUT, "10-legal")


def mock_espacios():
    d = frame("Admin - Espacios")
    sidebar(d, "Espacios")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Gestion de Espacios", "Administre los espacios del parqueadero")
    card(d, 270, 220, 870, 90, "Resumen de ocupacion")
    d.box(290, 255, 250, 40, "Ocupados: 35", kind="rounded", fill="#fee2e2", stroke="#fca5a5", font=12, bold=True)
    d.box(555, 255, 250, 40, "Libres: 65", kind="rounded", fill="#ecfdf5", stroke="#a7f3d0", font=12, bold=True)
    d.box(820, 255, 250, 40, "Ocupacion: 35.0%", kind="rounded", fill="#eff6ff", stroke="#bfdbfe", font=12, bold=True)
    card(d, 270, 330, 870, 340, "Matriz de espacios")
    for i in range(40):
        x = 290 + (i % 10) * 82
        y = 375 + (i // 10) * 70
        ocupado = i < 12
        d.box(x, y, 70, 56, f"A-{i + 1:03d}\n{'Ocupado' if ocupado else 'Libre'}", kind="rounded",
              fill="#fee2e2" if ocupado else "#ecfdf5", stroke="#fca5a5" if ocupado else "#a7f3d0", font=9)
    d.save(OUT, "11-espacios")


def mock_usuarios():
    d = frame("Admin - Usuarios")
    sidebar(d, "Usuarios")
    header(d, "Bienvenido, Administrador del Sistema", "Administrador")
    content(d)
    title(d, "Gestion de Usuarios", "Administre los usuarios del sistema")
    button(d, 1000, 165, 140, 34, "Nuevo Usuario")
    table(d, 270, 230, 870, ["Usuario", "Nombre", "Email", "Rol", "Estado"],
          [["admin", "Administrador del Sistema", "admin@parqueadero.com", "Administrador", "Activo"],
           ["operador", "Operador de Parqueadero", "operador@parqueadero.com", "Operador", "Activo"],
           ["cliente1", "Cliente Prueba", "cliente@ejemplo.com", "Cliente", "Activo"]])
    card(d, 660, 400, 480, 300, "Registrar Usuario")
    field(d, 676, 440, 448, "Nombre de usuario", "jperez")
    field(d, 676, 496, 448, "Nombre completo", "Juan Perez")
    field(d, 676, 552, 448, "Email", "juan@correo.com")
    field(d, 676, 608, 210, "Contrasena", "********")
    field(d, 900, 608, 224, "Rol", "Operador / Cliente")
    button(d, 676, 665, 300, 34, "Registrar Usuario")
    d.save(OUT, "12-usuarios")


def mock_portal_auth():
    d = frame("Portal de Clientes - Acceso")
    d.box(20, 66, W - 40, 70, "Parqueadero Neiva\nPortal de Clientes", kind="rect", fill="#ffffff", stroke="#e5e7eb",
          font=13, bold=True, align="left")
    d.box(400, 180, 360, 460, "", kind="rounded", fill="#ffffff", stroke="#e5e7eb")
    d.box(545, 200, 70, 70, "logo", kind="ellipse", fill=PRIMARY, stroke=PRIMARY, color="#ffffff", font=11)
    d.box(430, 290, 300, 26, "Portal de Clientes", kind="rect", fill="#ffffff", stroke="#ffffff", font=15, bold=True)
    d.box(430, 316, 300, 20, "Consulte su historial de parqueo", kind="rect", fill="#ffffff", stroke="#ffffff", font=10, color="#6b7280")
    d.box(430, 350, 150, 34, "Acceso con Cuenta", kind="rounded", fill=PRIMARY, stroke=PRIMARY, color="#ffffff", font=10)
    d.box(582, 350, 150, 34, "Acceso por Transaccion", kind="rounded", fill="#ffffff", stroke=BORDER, font=10)
    field(d, 430, 400, 300, "Correo electronico", "cliente@ejemplo.com")
    field(d, 430, 462, 300, "Contrasena", "********")
    button(d, 430, 530, 300, 40, "Ingresar")
    d.box(430, 590, 300, 20, "o use transaccion + ultimos 4 de la placa", kind="rect",
          fill="#ffffff", stroke="#ffffff", font=10, color="#9ca3af")
    d.save(OUT, "13-portal-cliente-auth")


def mock_portal_historial():
    d = frame("Portal de Clientes - Historial")
    d.box(20, 66, W - 40, 70, "Parqueadero Neiva\nPortal de Clientes", kind="rect", fill="#ffffff", stroke="#e5e7eb",
          font=13, bold=True, align="left")
    d.box(W - 260, 86, 220, 30, "Cliente Prueba   Cerrar Sesion", kind="rounded", fill=LIGHT, stroke="#e5e7eb", font=10)
    d.box(40, 170, 1080, 40, "Historial de Transacciones", kind="rect", fill="#ffffff", stroke="#ffffff", font=16, bold=True, align="left")
    card(d, 40, 220, 1080, 70)
    field(d, 60, 240, 150, "Desde", "2026-09-01")
    field(d, 230, 240, 150, "Hasta", "2026-09-30")
    button(d, 400, 258, 90, 30, "Filtrar")
    button(d, 500, 258, 90, 30, "Limpiar", fill="#ffffff")
    card(d, 40, 310, 1080, 180)
    rows = ["Fecha: 27/09/2026, 4:26 p.m.   Placa: ABC-123   Categoria: Liviano (A)",
            "Duracion: 2h 0min   Total: $ 10.000   Metodo: Efectivo   Estado: Completado"]
    d.box(60, 330, 700, 24, "TXN-20260927-00001", kind="rect", fill="#ffffff", stroke="#ffffff", font=12, bold=True, align="left")
    for i, r in enumerate(rows):
        d.box(60, 360 + i * 30, 1000, 26, r, kind="rect", fill="#ffffff", stroke="#f3f4f6", font=11, align="left")
    button(d, 60, 430, 180, 32, "Descargar Recibo", fill="#ffffff")
    card(d, 40, 520, 1080, 200, "Detalle expandido")
    detail = ["ID Transaccion: TXN-20260927-00001", "Entrada: 27/09/2026, 4:26 p.m.   Salida: 27/09/2026, 6:26 p.m.",
              "Metodo de pago: Efectivo   Monto pagado: $ 20.000   Cambio: $ 10.000",
              "Ticket / Recibo: Entrada TKT-20260927-58N2R4"]
    for i, r in enumerate(detail):
        d.box(60, 560 + i * 32, 1000, 28, r, kind="rect", fill="#ffffff", stroke="#f3f4f6", font=11, align="left")
    d.save(OUT, "14-portal-cliente-historial")


def main():
    mock_login()
    mock_dashboard()
    mock_entrada()
    mock_salida()
    mock_recibo()
    mock_activos()
    mock_tarifas()
    mock_reportes()
    mock_reclamos()
    mock_legal()
    mock_espacios()
    mock_usuarios()
    mock_portal_auth()
    mock_portal_historial()
    print("Mockups generados en", OUT)


if __name__ == "__main__":
    main()
