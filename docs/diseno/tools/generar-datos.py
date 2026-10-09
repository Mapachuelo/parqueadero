#!/usr/bin/env python3
"""Genera el modelo ER (draw.io/SVG), el DBML, el diccionario de datos y el mapeo
Prisma a partir de src/db/prisma/schema.prisma."""
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from drawio_lib import Diagram  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SCHEMA = os.path.join(ROOT, "src", "db", "prisma", "schema.prisma")
DBML_SRC = os.path.join(ROOT, "prisma", "dbml", "schema.dbml")
OUT = os.path.join(ROOT, "docs", "diseno", "datos")

TYPE_MAP = {
    "Int": "INTEGER",
    "BigInt": "BIGINT",
    "String": "VARCHAR / TEXT",
    "Boolean": "BOOLEAN",
    "DateTime": "TIMESTAMP(3)",
    "Decimal": "DECIMAL",
    "Float": "DOUBLE PRECISION",
    "Bytes": "BYTEA",
    "Json": "JSONB",
}

ENTITY_DESC = {
    "User": "Usuarios del sistema (admin, operador, cliente) con credenciales y estado.",
    "UserSession": "Sesiones JWT activas por usuario (login/logout y expiracion).",
    "AuditLog": "Registro inmutable de auditoria: quien, que, cuando y resultado.",
    "SystemConfig": "Configuracion global del sistema (clave/valor).",
    "UserNotificationPreference": "Preferencias de notificacion por usuario y tipo (RF-PERFIL-002).",
    "VehicleTransaction": "Transaccion de entrada/salida de un vehiculo (nucleo del negocio).",
    "Payment": "Pago asociado a una transaccion (metodo, monto, cambio, abono usado).",
    "Ticket": "Tiquete de entrada o recibo de salida emitido (cumplimiento legal).",
    "ParkingSpace": "Espacio fisico de parqueo y su estado de ocupacion (RF-ESPACIO-001).",
    "Claim": "Reclamo del cliente (dano, cobro incorrecto, robo/hurto, perdida).",
    "ClaimNote": "Notas de seguimiento de un reclamo.",
    "ClaimEvidence": "Evidencia adjunta de un reclamo (archivos).",
    "CustodyTerms": "Versiones de los terminos de custodia (RF-LEGAL-001).",
    "LegalChecklist": "Checklist legal de pre-operacion (RF-LEGAL-002).",
    "LegalChecklistItem": "Item verificable de un checklist legal.",
    "RateStructure": "Estructura tarifaria con vigencia (RF-TARIFA-001/002).",
    "Rate": "Tarifa por hora por categoria dentro de una estructura.",
    "FractionRate": "Tarifa por fraccion de 15/30/45 minutos por categoria (RF-TARIFA-004).",
    "RateChangeHistory": "Historico de cambios tarifarios (auditoria).",
    "RateChangeNotification": "Notificaciones de cambio tarifario (RF-TARIFA-003).",
    "MonthlySubscription": "Suscripcion mensual por placa (RF-TARIFA-004).",
    "SubscriptionNotification": "Notificaciones de vencimiento de mensualidad.",
    "PrepaidCredit": "Abono/crédito prepagado por placa (RF-TARIFA-004).",
    "PrepaidMovement": "Movimientos de consumo/recarga de un abono.",
    "CreditNotification": "Notificaciones de saldo bajo de abono.",
    "SyncLog": "Bitacora de sincronizacion offline (RF-OFFLINE-001).",
    "SyncConflict": "Conflictos de sincronizacion para revision manual (RF-OFFLINE-002).",
    "MvDailyOccupancy": "Agregado diario de ocupacion para reportes (snapshot).",
    "MvDailyRevenue": "Agregado diario de ingresos para reportes (snapshot).",
}

FIELD_DESC = {
    "id": "Identificador interno autoincremental.",
    "uuid": "Identificador publico unico.",
    "created_at": "Fecha de creacion del registro.",
    "updated_at": "Fecha de ultima actualizacion.",
    "is_active": "Indica si el registro esta vigente.",
    "plate_hash": "Hash SHA-256 de la placa (busqueda sin descifrar).",
    "plate_encrypted": "Placa cifrada con AES-256-GCM.",
    "plate": "Placa en claro (solo si aplica).",
    "category": "Categoria del vehiculo (A, B, C, D).",
    "status": "Estado del registro segun su ciclo de vida.",
    "entry_time": "Fecha y hora de entrada.",
    "exit_time": "Fecha y hora de salida.",
    "duration_minutes": "Duracion real en minutos.",
    "final_amount": "Monto final a pagar en COP.",
    "total_amount": "Monto bruto antes de descuentos.",
    "customer_name": "Nombre del propietario/conductor.",
    "customer_phone": "Telefono de contacto.",
    "customer_email": "Correo del cliente (asocia el portal cliente).",
    "space_assigned": "Codigo del espacio asignado.",
    "transaction_id": "Identificador de negocio de la transaccion (TXN-...).",
    "payment_method": "Metodo de pago utilizado.",
    "amount_paid": "Monto efectivamente recibido.",
    "change_amount": "Cambio devuelto (pago en efectivo).",
    "version": "Version del documento legal.",
    "is_completed": "Indica si el checklist fue completado.",
    "name": "Nombre descriptivo del registro.",
    "description": "Descripcion del registro.",
    "role": "Rol del usuario (admin, operador, cliente).",
    "email": "Correo electronico.",
    "username": "Nombre de usuario para autenticacion.",
    "token": "Token de sesion JWT.",
    "expires_at": "Fecha de expiracion de la sesion.",
    "date_hour": "Hora agregada del snapshot.",
    "total_spaces": "Total de espacios del parqueadero.",
    "occupied_spaces": "Espacios ocupados.",
    "free_spaces": "Espacios libres.",
    "occupancy_pct": "Porcentaje de ocupacion.",
    "total_transactions": "Numero de transacciones agregadas.",
    "total_revenue": "Ingresos agregados en COP.",
}


def parse_schema():
    text = open(SCHEMA, encoding="utf-8").read()
    models = {}
    for match in re.finditer(r"model\s+(\w+)\s*\{([^}]*)\}", text):
        name, body = match.group(1), match.group(2)
        fields = []
        table = None
        for raw in body.splitlines():
            line = raw.strip()
            if not line:
                continue
            if line.startswith("@@"):
                map_match = re.search(r'@@map\("([^"]+)"\)', line)
                if map_match:
                    table = map_match.group(1)
                continue
            if line.startswith("@"):
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            fname, ftype = parts[0], parts[1].rstrip("?[]")
            attrs = " ".join(parts[2:])
            optional = "?" in parts[1]
            fields.append({"name": fname, "type": ftype, "attrs": attrs, "optional": optional})
        models[name] = {"fields": fields, "table": table or camel_to_snake(name)}
    return models


def camel_to_snake(name):
    out = re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()
    return out


def is_pk(f):
    return "@id" in f["attrs"]


def is_fk(f, models):
    if "fields:" in f["attrs"]:
        return True
    return f["name"].endswith("_id") and f["type"] in models


def ref_model(f, models):
    match = re.search(r"references:\s*\[([^\]]+)\]", f["attrs"])
    if match:
        return f["type"]
    if f["name"].endswith("_id"):
        candidate = "".join(part.capitalize() for part in f["name"][:-3].split("_"))
        if candidate in models:
            return candidate
    return f["type"] if f["type"] in models else None


def er_diagram(models):
    names = list(models.keys())
    cols = 5
    bw, bh = 300, 210
    gap_x, gap_y = 40, 50
    rows = (len(names) + cols - 1) // cols
    d = Diagram("Modelo Entidad-Relacion", 60 + cols * (bw + gap_x), 80 + rows * (bh + gap_y))
    ids = {}
    for i, name in enumerate(names):
        x = 30 + (i % cols) * (bw + gap_x)
        y = 60 + (i // cols) * (bh + gap_y)
        info = models[name]
        fields = info["fields"]
        lines = []
        for f in fields[:9]:
            mark = ""
            if is_pk(f):
                mark = " [PK]"
            elif is_fk(f, models):
                mark = " [FK]"
            optional = "?" if f["optional"] else ""
            lines.append(f"- {f['name']}: {f['type']}{optional}{mark}")
        label = f"{name}\n({info['table']})\n" + "\n".join(lines)
        ids[name] = d.box(x, y, bw, bh, label, kind="classbox", fill="#ffffff",
                          stroke="#374151", font=9, align="left")
    drawn = set()
    for name, info in models.items():
        for f in info["fields"]:
            target = ref_model(f, models)
            if target and target in ids:
                key = tuple(sorted([name, target])) + (f["name"],)
                if key in drawn:
                    continue
                drawn.add(key)
                d.link(ids[name], ids[target], f"{f['name']}", arrow="open")
    d.save(OUT, "er-modelo")


def dbml_copy():
    if os.path.exists(DBML_SRC):
        shutil.copyfile(DBML_SRC, os.path.join(OUT, "modelo-er.dbml"))


def dictionary(models):
    lines = [
        "# Diccionario de datos",
        "",
        "Generado automaticamente desde `src/db/prisma/schema.prisma` (PostgreSQL 16).",
        "Fuente de verdad: migracion `20260522181540_init`. Regenerar con",
        "`python3 docs/diseno/tools/generar-datos.py`.",
        "",
        f"Total de entidades: **{len(models)}**.",
        "",
        "## Convenciones",
        "",
        "- `PK`: clave primaria. `FK`: clave foranea. `UQ`: unico.",
        "- Tipos SQL indicativos; Prisma es la definicion oficial.",
        "- `?` indica campo opcional (nullable).",
        "",
        "---",
        "",
    ]
    for name, info in models.items():
        lines.append(f"## {name}")
        lines.append("")
        lines.append(f"Tabla: `{info['table']}`")
        lines.append("")
        lines.append(ENTITY_DESC.get(name, ""))
        lines.append("")
        lines.append("| Campo | Tipo Prisma | Tipo SQL | Nulo | Clave | Descripcion |")
        lines.append("|-------|-------------|----------|------|-------|-------------|")
        for f in info["fields"]:
            keys = []
            if is_pk(f):
                keys.append("PK")
            if is_fk(f, models):
                keys.append("FK")
            if "@unique" in f["attrs"]:
                keys.append("UQ")
            sql_type = TYPE_MAP.get(f["type"], f["type"])
            desc = FIELD_DESC.get(f["name"], "-")
            lines.append(
                f"| `{f['name']}` | {f['type']} | {sql_type} | {'Si' if f['optional'] else 'No'} | "
                f"{', '.join(keys) or '-'} | {desc} |"
            )
        lines.append("")
    with open(os.path.join(OUT, "diccionario-datos.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def mapping(models):
    lines = [
        "# Mapeo entidad UML / modelo Prisma / tabla SQL",
        "",
        "Correspondencia entre el diagrama ER (`er-modelo.drawio`), el modelo Prisma y las",
        "tablas de `db/postgresql_schema.sql` y la migracion `20260522181540_init`.",
        "",
        "| Entidad UML | Modelo Prisma | Tabla PostgreSQL | Campos |",
        "|-------------|---------------|------------------|--------|",
    ]
    for name, info in models.items():
        lines.append(f"| {name} | `{name}` | `{info['table']}` | {len(info['fields'])} |")
    lines.append("")
    lines.append("> Las entidades `MvDailyOccupancy` y `MvDailyRevenue` son tablas de agregados")
    lines.append("> (no vistas materializadas) segun la migracion; `db/postgresql_schema.sql` fue")
    lines.append("> alineado a esta definicion.")
    with open(os.path.join(OUT, "mapeo-er-prisma.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def main():
    os.makedirs(OUT, exist_ok=True)
    models = parse_schema()
    er_diagram(models)
    dbml_copy()
    dictionary(models)
    mapping(models)
    print(f"Generados ER/DBML/diccionario/mapeo para {len(models)} entidades en {OUT}")


if __name__ == "__main__":
    main()
