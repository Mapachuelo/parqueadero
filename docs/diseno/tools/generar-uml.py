#!/usr/bin/env python3
"""Genera los diagramas UML del sistema en formato draw.io y SVG."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drawio_lib import Diagram  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "diseno", "uml")

C_BOX = ("#dae8fc", "#6c8ebf")
C_SVC = ("#d5e8d4", "#82b366")
C_DB = ("#ffe6cc", "#d79b00")
C_COMP = ("#e1d5e7", "#9673a6")
C_NOTE = ("#fff2cc", "#d6b656")
C_EXT = ("#f5f5f5", "#666666")
C_ACTOR = ("#ffffff", "#374151")


def classbox(d, x, y, w, h, name, fields):
    label = name + "\n" + "\n".join(fields)
    return d.box(x, y, w, h, label, kind="classbox", fill="#ffffff", stroke="#374151", font=10, align="left")


def casos_de_uso():
    d = Diagram("Casos de uso", 1560, 1080)
    d.box(320, 70, 1180, 960, "Sistema de Gestion de Parqueaderos Publicos", kind="package",
          fill="none", stroke="#6b7280", font=14, align="left")
    admin = d.box(70, 200, 50, 90, "Administrador", kind="actor", fill=C_ACTOR[0], stroke=C_ACTOR[1], font=12)
    oper = d.box(70, 540, 50, 90, "Operador", kind="actor", fill=C_ACTOR[0], stroke=C_ACTOR[1], font=12)
    cli = d.box(70, 860, 50, 90, "Cliente", kind="actor", fill=C_ACTOR[0], stroke=C_ACTOR[1], font=12)

    def uc(x, y, text):
        return d.box(x, y, 220, 70, text, kind="ellipse", fill=C_BOX[0], stroke=C_BOX[1], font=11)

    login = uc(400, 120, "Iniciar sesion")
    perfil = uc(680, 120, "Gestionar perfil")
    sync = uc(960, 120, "Sincronizar offline")
    entrada = uc(400, 230, "Registrar entrada")
    activos = uc(680, 230, "Consultar activos")
    salida = uc(960, 230, "Registrar salida y pago")
    tarifas = uc(400, 340, "Gestionar tarifas")
    espacios = uc(680, 340, "Gestionar espacios")
    reportes = uc(960, 340, "Generar reportes")
    usuarios = uc(400, 450, "Gestionar usuarios")
    reclamos = uc(680, 450, "Gestionar reclamos")
    legal = uc(960, 450, "Gestion legal (terminos/checklist)")
    historial = uc(400, 620, "Consultar historial propio")
    acceso_tx = uc(680, 620, "Acceso por transaccion")
    recibo = uc(960, 620, "Ver recibo digital")

    for target in (login, perfil, tarifas, espacios, reportes, usuarios, reclamos, legal, entrada, activos, salida, sync):
        d.link(admin, target, arrow="open")
    for target in (login, perfil, entrada, activos, salida):
        d.link(oper, target, arrow="open")
    for target in (login, perfil, historial, acceso_tx, recibo):
        d.link(cli, target, arrow="open")

    d.box(400, 780, 780, 200,
          "Trazabilidad:\nRF-ACCESO-001/002/003 -> Iniciar sesion, Gestionar perfil\n"
          "RF-RECEP-001/002/004/005 -> Registrar entrada\nRF-SALIDA-001/002/004/005 -> Registrar salida y pago\n"
          "RF-TARIFA-001..004 -> Gestionar tarifas\nRF-LEGAL-001..004 -> Gestion legal, Gestionar reclamos\n"
          "RF-REPORT-001..005 -> Generar reportes\nRF-OFFLINE-001/002 -> Sincronizar offline\n"
          "RF-ESPACIO-001 -> Gestionar espacios, Consultar activos\nRF-CLIENTE-001 -> Consultar historial, Acceso por transaccion\n"
          "RF-PERFIL-001..007 -> Gestionar perfil",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=11, align="left")
    d.save(OUT, "casos-de-uso")


def clases():
    d = Diagram("Diagrama de clases", 1780, 1020)
    cols = [40, 330, 620, 910, 1200, 1490]
    row_y = [70, 290, 520, 760]
    specs = [
        ("User", ["id, uuid", "username, email", "role", "is_active"], 0, 0),
        ("UserSession", ["id, user_id FK", "token", "expires_at"], 0, 1),
        ("AuditLog", ["id, user_id FK", "action", "result"], 0, 2),
        ("SystemConfig", ["key, value", "description"], 0, 3),
        ("UserNotificationPreference", ["id, user_id FK", "notification_type", "in_app, email"], 0, 4),
        ("VehicleTransaction", ["id, transaction_id", "plate_encrypted, plate_hash", "category, customer_name", "customer_email", "entry_time, exit_time", "final_amount, status", "space_assigned FK"], 1, 0),
        ("Payment", ["id", "transaction_id FK", "payment_method", "amount_paid, change_amount", "status"], 1, 1),
        ("Ticket", ["id", "transaction_id FK", "ticket_type", "ticket_number", "custody_terms_version"], 1, 2),
        ("ParkingSpace", ["id", "space_code", "zone", "is_occupied", "current_transaction_id"], 1, 3),
        ("Claim", ["id, claim_id", "transaction_id FK", "category, status", "description", "resolution_deadline"], 1, 4),
        ("RateStructure", ["id", "name", "effective_date", "is_active"], 2, 0),
        ("Rate", ["id", "structure_id FK", "category", "price_per_hour", "is_active"], 2, 1),
        ("FractionRate", ["id", "structure_id FK", "category", "minutes15/30/45"], 2, 2),
        ("MonthlySubscription", ["id", "plate_hash", "customer_name", "monthly_amount", "start_date, end_date"], 2, 3),
        ("PrepaidCredit", ["id, credit_id", "plate_hash", "balance", "original_amount", "is_active"], 2, 4),
        ("PrepaidMovement", ["id", "credit_id FK", "type, amount", "balance_after"], 3, 0),
        ("ClaimNote", ["id", "claim_id FK", "user_id FK", "content"], 3, 1),
        ("ClaimEvidence", ["id", "claim_id FK", "file_path"], 3, 2),
        ("CustodyTerms", ["id", "version", "content", "is_active"], 3, 3),
        ("LegalChecklist", ["id", "name", "is_completed", "completed_at"], 3, 4),
        ("LegalChecklistItem", ["id", "checklist_id FK", "category", "is_checked"], 3, 5),
    ]
    ids = {}
    for name, fields, r, c in specs:
        h = 150 if len(fields) <= 5 else 175
        ids[name] = classbox(d, cols[c], row_y[r], 250, h, name, fields)
    rels = [
        ("User", "UserSession", "1..*"),
        ("User", "AuditLog", "1..*"),
        ("User", "UserNotificationPreference", "1..*"),
        ("User", "VehicleTransaction", "registra 1..*"),
        ("VehicleTransaction", "Payment", "1..1"),
        ("VehicleTransaction", "Ticket", "1..*"),
        ("VehicleTransaction", "Claim", "1..*"),
        ("VehicleTransaction", "ParkingSpace", "0..1"),
        ("RateStructure", "Rate", "1..*"),
        ("RateStructure", "FractionRate", "1..*"),
        ("PrepaidCredit", "PrepaidMovement", "1..*"),
        ("Claim", "ClaimNote", "1..*"),
        ("Claim", "ClaimEvidence", "1..*"),
        ("LegalChecklist", "LegalChecklistItem", "1..*"),
        ("MonthlySubscription", "User", "registrada por"),
    ]
    for a, b, label in rels:
        d.link(ids[a], ids[b], label, arrow="open")
    d.box(40, 940, 700, 60, "Entidades agregadas mv_daily_occupancy y mv_daily_revenue (snapshots de reportes) no se grafican aqui; ver ER en datos/.",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=11, align="left")
    d.save(OUT, "clases")


def _lifelines(d, names, y=70, height=620, width=150):
    n = len(names)
    margin = 40
    step = (d.width - 2 * margin - width) / (n - 1) if n > 1 else 0
    shapes = []
    for i, name in enumerate(names):
        sid = d.box(margin + i * step, y, width, height, name, kind="lifeline",
                    fill=C_BOX[0], stroke=C_BOX[1], font=12)
        shapes.append(d.shape_by_id(sid))
    return shapes


def _msgs(d, lifelines, msgs, start=150, step=52):
    xs = [l.x + l.w / 2 for l in lifelines]
    for i, item in enumerate(msgs):
        a, b, label = item
        y = start + i * step
        d.msg(xs[a], y, xs[b], y, label, dashed=False)


def secuencia_login():
    d = Diagram("Secuencia - Inicio de sesion", 1360, 800)
    ls = _lifelines(d, ["Operador", "SPA React", "API Fastify", "AuthService", "Prisma / PostgreSQL"])
    for l in ls:
        l.h = 700
    _msgs(d, ls, [
        (0, 1, "1. Ingresa usuario y contrasena"),
        (1, 2, "2. POST /api/auth/login"),
        (2, 3, "3. login(identifier, password)"),
        (3, 4, "4. findByUsernameOrEmail()"),
        (4, 3, "5. user + password_hash"),
        (3, 4, "6. bcrypt.compare + resetFailedAttempts"),
        (3, 4, "7. updateLastLogin + createSession"),
        (3, 2, "8. { token, user }"),
        (2, 1, "9. 200 OK { token, user }"),
        (1, 0, "10. setToken + navega al panel por rol"),
    ])
    d.box(1030, 660, 300, 90, "Sesion JWT: 30 min (admin/operador)\ny 20 min (cliente).\nAdvertencia 5 min antes del cierre.",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=11, align="left")
    d.save(OUT, "secuencia-login")


def secuencia_entrada():
    d = Diagram("Secuencia - Registro de entrada", 1360, 820)
    ls = _lifelines(d, ["Operador", "SPA React", "TransactionsController", "TransactionsService", "Prisma / PostgreSQL", "Crypto / Utils"])
    for l in ls:
        l.h = 720
    _msgs(d, ls, [
        (0, 1, "1. Placa, categoria, cliente"),
        (1, 2, "2. POST /api/transactions/entry"),
        (2, 3, "3. registerEntry(operatorId, data)"),
        (3, 5, "4. isValidPlate + hashPlate + encryptPlate"),
        (3, 4, "5. findActiveByPlateHash()"),
        (4, 3, "6. sin duplicados activos"),
        (3, 4, "7. countAvailableSpaces + assignSpace"),
        (3, 4, "8. createTransaction + createTicket"),
        (4, 3, "9. transaccion + ticket"),
        (3, 2, "10. resultado"),
        (2, 1, "11. 201 { transaction_id, ticket }"),
        (1, 0, "12. Muestra ticket de entrada"),
    ])
    d.save(OUT, "secuencia-entrada")


def secuencia_salida():
    d = Diagram("Secuencia - Salida y pago", 1360, 900)
    ls = _lifelines(d, ["Operador", "SPA React", "API Fastify", "TransactionsService", "PaymentsService", "Prisma / PostgreSQL"])
    for l in ls:
        l.h = 800
    _msgs(d, ls, [
        (0, 1, "1. Busca por placa o ID"),
        (1, 2, "2. GET /api/transactions/active"),
        (2, 5, "3. findActiveTransactions()"),
        (5, 2, "4. activos"),
        (2, 1, "5. 200 activos"),
        (1, 3, "6. POST /transactions/:id/exit"),
        (3, 5, "7. calcula duracion/tarifa + updateForExit + releaseSpace"),
        (3, 1, "8. montos (final_amount)"),
        (1, 4, "9. POST /api/payments"),
        (4, 5, "10. createPayment + ticket salida + updateTransaction"),
        (4, 1, "11. recibo"),
        (1, 0, "12. Muestra recibo de salida"),
    ])
    d.save(OUT, "secuencia-salida-pago")


def secuencia_sync():
    d = Diagram("Secuencia - Sincronizacion offline", 1360, 760)
    ls = _lifelines(d, ["POS SQLite (offline)", "API Sync (API Key)", "SyncService", "Prisma / PostgreSQL"])
    for l in ls:
        l.h = 660
    _msgs(d, ls, [
        (0, 1, "1. POST /api/sync (X-API-Key) batch pendientes"),
        (1, 2, "2. sync(batch)"),
        (2, 3, "3. upsert transactions / rates / users"),
        (3, 2, "4. resultado + conflictos detectados"),
        (2, 3, "5. sync_log + sync_conflicts"),
        (3, 2, "6. ok"),
        (2, 1, "7. { synced, conflicts, conflict_ids }"),
        (1, 0, "8. 200 + marca registros como sincronizados"),
    ])
    d.save(OUT, "secuencia-sync")


def componentes():
    d = Diagram("Componentes", 1560, 940)
    cliente = d.box(40, 60, 260, 90, "Cliente Web\n(Navegador: Chromium/Firefox)", kind="component",
                    fill=C_EXT[0], stroke=C_EXT[1], font=12)
    nginx = d.box(360, 60, 240, 90, "nginx\n(TLS + proxy /api)", kind="component",
                  fill=C_COMP[0], stroke=C_COMP[1], font=12)
    spa = d.box(40, 240, 260, 150, "SPA React 19\n- routes (_admin/_operator/_cliente)\n- components\n- lib: api.ts (ky), auth.tsx",
                kind="component", fill=C_BOX[0], stroke=C_BOX[1], font=11)
    portal = d.box(360, 240, 240, 150, "Portal Cliente\n- autenticacion email\n- transaccion + ultimos 4\n- historial",
                   kind="component", fill=C_BOX[0], stroke=C_BOX[1], font=11)
    backend = d.box(660, 60, 860, 520, "Backend Fastify (modular monolith)", kind="package",
                    fill="none", stroke="#6b7280", font=14, align="left")
    modules = [
        ("auth", 690, 110), ("transactions", 900, 110), ("payments", 1110, 110), ("rates", 1320, 110),
        ("reports", 690, 210), ("legal", 900, 210), ("claims", 1110, 210), ("spaces", 1320, 210),
        ("profile", 690, 310), ("client", 900, 310), ("sync", 1110, 310), ("jobs (node-cron)", 1320, 310),
    ]
    for name, x, y in modules:
        d.box(x, y, 190, 70, name + "\n(router/controller/\nservice/repository)", kind="component",
              fill=C_SVC[0], stroke=C_SVC[1], font=10)
    d.box(690, 420, 400, 120, "Shared: middlewares (auth, role, rate-limit, audit),\nutils (crypto AES-256-GCM, ids, date, plate),\nservices (mail, pdf), i18n es-CO",
          kind="component", fill=C_NOTE[0], stroke=C_NOTE[1], font=10, align="left")
    d.box(1110, 420, 400, 120, "Swagger /docs\nHealth /health y /health/ready\nUnder-pressure + Helmet + JWT",
          kind="component", fill=C_NOTE[0], stroke=C_NOTE[1], font=10, align="left")
    prisma = d.box(660, 660, 400, 90, "Prisma Client (ORM)", kind="component", fill=C_DB[0], stroke=C_DB[1], font=12)
    postgres = d.box(1120, 660, 400, 90, "PostgreSQL 16\n(pod parqueadero-db)", kind="cylinder", fill=C_DB[0], stroke=C_DB[1], font=12)
    pos = d.box(40, 500, 520, 130, "POS offline\nSQLite local (pendiente SQLCipher)\n+ POST /api/sync con API Key",
                kind="component", fill=C_EXT[0], stroke=C_EXT[1], font=11)

    d.link(cliente, nginx, "HTTPS 443")
    d.link(nginx, backend, "proxy /api -> :3000")
    d.link(backend, prisma, "usa repositorios")
    d.link(prisma, postgres, "TCP 5432")
    d.link(spa, nginx, "assets + /api")
    d.link(portal, nginx, "HTTPS")
    d.link(pos, backend, "HTTPS + API Key")
    d.save(OUT, "componentes")


def despliegue():
    d = Diagram("Despliegue (Podman pods)", 1560, 900)
    host = d.box(40, 40, 1480, 800, "Servidor Linux - Podman rootless", kind="package",
                 fill="none", stroke="#6b7280", font=15, align="left")
    pod_db = d.box(100, 110, 460, 340, "Pod parqueadero-db", kind="package",
                   fill="#f8fafc", stroke="#374151", font=13, align="left")
    postgres = d.box(140, 170, 380, 90, "postgres:16\nPOSTGRES_DB=parqueadero\n(containerPort 5432, interno)",
                     kind="component", fill=C_DB[0], stroke=C_DB[1], font=11)
    d.box(140, 290, 180, 80, "PVC\nparqueadero-pgdata\n10Gi", kind="cylinder",
          fill=C_DB[0], stroke=C_DB[1], font=10)
    d.box(340, 290, 180, 80, "Secret\nparqueadero-secrets\ndb_password, jwt, plate, sync",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=10, align="left")
    pod_app = d.box(640, 110, 840, 460, "Pod parqueadero-app", kind="package",
                    fill="#f8fafc", stroke="#374151", font=13, align="left")
    backend = d.box(680, 170, 340, 110, "backend\nnode:22-alpine\nCMD node dist/server.js\ncontainerPort 3000 (interno)",
                    kind="component", fill=C_SVC[0], stroke=C_SVC[1], font=11)
    frontend = d.box(1060, 170, 380, 110, "frontend\nnginx:alpine\nlisten 443 (TLS)\nhostPort 3001",
                     kind="component", fill=C_COMP[0], stroke=C_COMP[1], font=11)
    d.box(680, 320, 180, 80, "PVC uploads\n5Gi", kind="cylinder", fill=C_DB[0], stroke=C_DB[1], font=10)
    d.box(880, 320, 180, 80, "PVC backups\n5Gi", kind="cylinder", fill=C_DB[0], stroke=C_DB[1], font=10)
    d.box(1080, 320, 360, 80, "hostPath TLS\n/etc/parqueadero/ssl -> /etc/nginx/ssl\n(en local: ./ssl)",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=10, align="left")
    net = d.box(640, 610, 840, 90, "Red interna parqueadero-net (DNS de podman: parqueadero-db:5432)",
                kind="rounded", fill="#eef2ff", stroke="#6366f1", font=12)
    usuario = d.box(120, 640, 420, 120, "Usuario final\nNavegador -> https://localhost:3001\n(o dominio con TLS valido)",
                    kind="component", fill=C_EXT[0], stroke=C_EXT[1], font=11)
    d.link(usuario, frontend, "HTTPS 3001")
    d.link(frontend, backend, "localhost:3000")
    d.link(backend, postgres, "parqueadero-db:5432")
    d.save(OUT, "despliegue")


def estados():
    d = Diagram("Estados - Transaccion", 1360, 620)
    start = d.box(80, 260, 50, 50, "", kind="start")
    activa = d.box(220, 240, 220, 90, "activa\n(vehiculo en parqueadero)", fill=C_BOX[0], stroke=C_BOX[1], font=12)
    completada = d.box(620, 100, 220, 90, "completada\n(salida + pago)", fill=C_SVC[0], stroke=C_SVC[1], font=12)
    cancelada = d.box(620, 400, 220, 90, "cancelada\n(anulacion)", fill="#f8cecc", stroke="#b85450", font=12)
    fin = d.box(1020, 120, 50, 50, "", kind="end")
    d.link(start, activa, "registrar entrada", arrow="block")
    d.link(activa, completada, "registrar salida\n+ procesar pago", arrow="block")
    d.link(activa, cancelada, "anular", arrow="block")
    d.link(completada, fin, "", arrow="block")
    d.box(220, 430, 330, 120, "sync_status: pending -> synced\n(conflict si hay duplicado)\nRF-OFFLINE-001/002",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=11, align="left")
    d.box(920, 400, 400, 140, "Espacio de parqueo:\nocupado al asignar en la entrada\nliberado al completar la salida\nRF-ESPACIO-001",
          kind="note", fill=C_NOTE[0], stroke=C_NOTE[1], font=11, align="left")
    d.save(OUT, "estados-transaccion")


def main():
    casos_de_uso()
    clases()
    secuencia_login()
    secuencia_entrada()
    secuencia_salida()
    secuencia_sync()
    componentes()
    despliegue()
    estados()
    print("Diagramas UML generados en", OUT)


if __name__ == "__main__":
    main()
