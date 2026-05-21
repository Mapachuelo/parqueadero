# DOCUMENTO DE ESPECIFICACIÓN DE REQUISITOS (SRS)
## Sistema de Gestión de Parqueaderos Públicos - Neiva, Colombia
**Versión:** 1.0  
**Fecha:** 5 de mayo de 2026  
**Estándar:** IEEE Std 830-1998

---

# 1. Introducción

## 1.1 Propósito del Documento

Este Documento de Especificación de Requisitos de Software (SRS) define la totalidad de requisitos funcionales y no funcionales para el **Sistema de Gestión de Parqueaderos Públicos** implementado en Neiva, Colombia. El propósito es establecer una base clara, completa y verificable para el desarrollo, validación y entrega del sistema, asegurando que el producto final cumpla con todas las necesidades operativas, legales y comerciales identificadas.

El documento está dirigido a:
- **Desarrolladores:** Para guiar la implementación del sistema.
- **Stakeholders y Propietarios:** Para validar y aprobar requisitos.
- **Equipo de Pruebas:** Para definir criterios de aceptación y casos de prueba.
- **Equipo Legal y Compliance:** Para verificar adherencia a normativas (Ley 1801/2016, Ley 1480/2011).

---

## 1.2 Alcance del Producto (Scope)

### Qué INCLUYE el Sistema:

El Sistema de Gestión de Parqueaderos Públicos es una aplicación integral que:

1. **Gestión de recepción de vehículos:** Registra la entrada de vehículos capturando placa, hora de entrada, categoría, y datos del propietario.
2. **Generación y Emisión de Tiquetes:** Produce tiquetes de estacionamiento que contienen información de acceso, tarifa y duración.
3. **Gestión de Salida y Pago:** Registra la salida de vehículos, calcula tarifa según categoría y duración, y procesa pagos.
4. **Administración Tarifaria:** Permite configuración y actualización de tarifas por categoría de vehículo (A, B, C, D) con vigencia temporal.
5. **Reportes Operacionales:** Genera reportes de ocupación, ingresos, históricos de parqueo y auditoría.
6. **Cumplimiento Legal:** Implementa controles y registros conforme a Ley 1801/2016 (Código de Policía) y Ley 1480/2011 (Protección del Consumidor).
7. **Operación Offline:** Mantiene funcionalidad operativa básica sin conectividad a internet.
8. **Gestión de Usuarios:** Administra roles (Propietario/Admin, Operador, Cliente) con autenticación y autorización.

### Qué NO INCLUYE el Sistema:

1. **NO es un Sistema de Control Policial:** El sistema NO realiza funciones de vigilancia estatal, control vehicular, expedición de multas o sanciones penales. Exclusivamente gestiona el parqueo como servicio comercial.
2. **NO Verifica SOAT o Técnico-Mecánica:** El sistema NO valida la vigencia o regularidad de seguros (SOAT) ni revisiones técnico-mecánicas. Esta es responsabilidad de autoridades de tránsito, no del operador del parqueadero.
3. **NO Incluye Sistema de Videovigilancia Integrado:** La captura de placas mediante OCR/Cámaras es un módulo opcional futuro, no está en el alcance inicial.
4. **SÍ Gestiona Reclamaciones por Daño, Robo o Hurto:** El sistema DEBE registrar, rastrear y soportar reclamaciones por daño, robo, hurto o pérdida de vehículos, accesorios o contenido, y el parqueadero asume responsabilidad conforme a sus políticas y obligaciones contractuales.
5. **NO Realiza Depósito o Inmovilización de Vehículos:** Funcionalidades de depósito o retención judicial quedan fuera del alcance operacional directo.

---

## 1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|---------|-----------|
| **RF** | Requerimiento funcional. Especifica una acción o comportamiento que el sistema debe ejecutar. |
| **RNF** | Requerimiento No Funcional. Especifica atributos de calidad, rendimiento, seguridad y confiabilidad del sistema. |
| **SRS** | Software Requirements Specification. Documento formal de especificación de requisitos. |
| **IEEE 830** | IEEE Std 830-1998. Estándar de la Sociedad de Ingenieros Eléctricos y Electrónicos para la especificación de requisitos de software. |
| **Placa** | Identificador alfanumérico único del vehículo registrado en la Oficina de Tránsito. |
| **Tiquete** | Comprobante impreso o digital emitido al propietario/conductor como evidencia de entrada y términos de custodia. |
| **Categoría A** | Vehículos livianos de hasta 4 pasajeros (automóviles, jeeps). |
| **Categoría B** | Vehículos medios (camiones pequeños, vans, buses pequeños). |
| **Categoría C** | Vehículos pesados (camiones, buses grandes, maquinaria). |
| **Categoría D** | Motocicletas y vehículos de dos ruedas. |
| **Ley 1801/2016** | Código Nacional de Policía y Convivencia de Colombia. Establece obligaciones de seguridad para parqueaderos públicos. |
| **Ley 1480/2011** | Estatuto del Consumidor Colombiano. Define derechos del cliente y obligaciones comerciales. |
| **Ley de Protección de Datos** | Normativa sobre tratamiento de datos personales (placas vehiculares) en Colombia. |
| **SOAT** | Seguro Obligatorio de Accidentes de Tránsito. Responsabilidad de propietario/conductor, no del parqueadero. |
| **Técnico-Mecánica** | Revisión técnica de estado mecánico de vehículos. Responsabilidad de autoridades, no del parqueadero. |
| **OCR** | Optical Character Recognition. Tecnología de reconocimiento óptico de caracteres para lectura de placas. |
| **Admin/Propietario** | Rol de usuario con máximos privilegios de configuración y auditoría del sistema. |
| **Operador** | Rol de usuario que ejecuta operaciones diarias: recepción, salida, cálculo de tarifas. |
| **Cliente** | Propietario o conductor del vehículo que utiliza el servicio de parqueadero. |
| **Custodia** | Responsabilidad limitada del parqueadero de mantener seguridad física dentro de instalaciones. |
| **Tarifa** | Precio monetario por hora o fracción de hora de uso del servicio de parqueadero. |
| **Recibo** | Comprobante de pago y salida del vehículo. |

---

# 2. Descripción general

## 2.1 Perspectiva del Producto

El Sistema de Gestión de Parqueaderos Públicos se desarrolla en el contexto operacional de **Neiva, Colombia**, donde existe la necesidad de modernizar y formalizar la operación de parqueaderos públicos en línea con normativas nacionales.

**Situación Actual (AS-IS):**
- Procesos manuales de registro en cuadernos o formatos impresos.
- Cálculo manual de tarifas propenso a errores.
- Falta de trazabilidad y auditoría de transacciones.
- Incumplimiento parcial de requisitos legales de protección de datos e información del cliente.
- Imposibilidad de generar reportes precisos de ocupación e ingresos.

**Situación Deseada (TO-BE):**
- Sistema informatizado integral que automatiza recepción, salida y pago.
- Cálculo automático y configurable de tarifas por categoría.
- Trazabilidad completa y auditabilidad de todas las transacciones.
- Cumplimiento con Ley 1801/2016 y Ley 1480/2011.
- Reportería en tiempo real de ocupación e ingresos.
- Protección de datos personales y placas según normativa.

**Rol del Sistema:**
El sistema actúa como **herramienta operacional** que reemplaza procesos manuales, mejora la eficiencia, garantiza cumplimiento legal y proporciona visibilidad gerencial sobre operaciones del parqueadero. NO sustituye la responsabilidad legal del propietario/operador; la refuerza con procesos formalizados y documentados.

---

## 2.2 Funciones del Producto

El Sistema de Gestión de Parqueaderos Públicos entrega las siguientes **capacidades principales:**

### Función 1: Gestión de Entrada de Vehículos
El sistema captura, registra y almacena la información de cada vehículo que ingresa al parqueadero, incluyendo identificación única (placa), hora de entrada, categoría, y datos del propietario. Genera automáticamente un tiquete de comprobante.

### Función 2: Cálculo Automático de Tarifas
El sistema calcula la tarifa de estacionamiento basado en:
- Categoría del vehículo (A, B, C, D).
- Duración del parqueo (hora de entrada vs. salida).
- Tarifa configurada para cada categoría.
- Políticas de redondeo (fracción de hora = hora completa).

### Función 3: Gestión de Salida y Pago
El sistema registra la salida del vehículo, presenta el cálculo de tarifa al operador, procesa el pago, emite recibo, y cierra el registro de transacción.

### Función 4: Administración de Tarifas
El sistema permite al propietario/admin configurar y actualizar tarifas por categoría, establecer vigencia temporal, y visualizar histórico de cambios tarifarios.

### Función 5: Reportería y Análisis
El sistema genera reportes de:
- Ocupación actual y histórica.
- Ingresos diarios, mensuales, por categoría.
- Transacciones y auditoría de todas las operaciones.
- Duración promedio de parqueo.

### Función 6: Control de Cumplimiento Legal
El sistema implementa y evidencia:
- Emisión de tiquetes/recibos (Ley 1480/2011).
- Términos de custodia y limitación de responsabilidad (Ley 1801/2016).
- Protección de datos personales y placas vehiculares.
- Checklist de pre-operación legal.

### Función 7: Operación Offline
El sistema mantiene funcionalidad básica de recepción y salida sin conectividad a internet, con sincronización automática al recuperar conexión.

### Función 8: Gestión de Usuarios y Roles
El sistema autentica usuarios y asigna permisos según rol:
- **Admin/Propietario:** Acceso total a configuración, reportes, usuarios.
- **Operador:** Recepción, salida, visualización de transacciones.
- **Cliente (opcional):** Consulta de tiquete o recibo en línea.

---

## 2.3 Características de los Usuarios

El sistema está diseñado para ser utilizado por **tres perfiles principales de usuario**, cada uno con niveles de interacción y privilegios diferenciados:

### Perfil 1: Propietario / Administrador del Parqueadero

**Características:**
- Responsabilidad legal del negocio y cumplimiento normativo.
- Acceso a todas las funciones de administración del sistema.
- Rara vez interactúa en operaciones diarias (puede delegar a operadores).
- Requiere reportería y visibilidad ejecutiva.

**Nivel de Interacción:**
- Configuración de tarifas y políticas.
- Auditoría de transacciones y operadores.
- Generación de reportes e informes legales.
- Gestión de usuarios (crear, modificar, desactivar operadores).
- Revisión de cumplimiento legal (tiquetes, recibos, tratamiento de datos).

**Competencias Requeridas:**
- Conocimiento de normativa (Ley 1801/2016, Ley 1480/2011).
- Capacidad de interpretación de reportes.
- Responsabilidad en toma de decisiones operativas y comerciales.

---

### Perfil 2: Operador del Parqueadero

**Características:**
- Personal diario que ejecuta operaciones de recepción y salida de vehículos.
- Interacción frecuente con el sistema (múltiples veces por hora durante operación).
- Rol de bajo privilegio (NO puede modificar tarifas ni acceder a reportes confidenciales).
- Puede trabajar en ambiente offline (sin internet) durante jornada.

**Nivel de Interacción:**
- Registro de entrada: captura placa, hora, categoría, datos propietario.
- Registro de salida: selecciona vehículo, confirma duración, aplica tarifa.
- Procesamiento de pago y emisión de recibo.
- Visualización de su propio histórico de transacciones.
- Impresión de tiquetes y recibos.

**Competencias Requeridas:**
- Capacidad de lectura de placas (manual o asistida por OCR).
- Manejo de herramientas de cobro/caja.
- Atención al cliente.
- Precisión en registro de datos.

---

### Perfil 3: Cliente / Propietario o Conductor del Vehículo

**Características:**
- Usuario externo que utiliza el servicio de parqueadero.
- Interacción mínima con el sistema (típicamente recibe tiquete impreso).
- Puede requerir acceso digital opcional a comprobantes (futuro).

**Nivel de Interacción:**
- Recepción de tiquete impreso al ingresar vehículo.
- Presentación de tiquete/recibo al salir.
- Lectura de términos de custodia en tiquete.
- Consulta opcional de recibo en línea (funcionalidad futura).

**Competencias Requeridas:**
- Capacidad de lectura de documentos impresos.
- Comprensión de información tarifaria y términos legales.

---

## 2.4 Restricciones Generales

Las siguientes restricciones aplican al desarrollo, operación y evolución del sistema:

### 2.4.1 Restricciones Legales y Normativas

1. **Ley 1801/2016 (Código Nacional de Policía y Convivencia):**
   - El sistema debe implementar controles de seguridad conforme a artículos aplicables.
   - debe facilitar la emisión de tiquetes con términos de custodia que aclaren limitaciones de responsabilidad del parqueadero.
   - debe mantener registros auditables de operaciones por mínimo 2 años.

2. **Ley 1480/2011 (Estatuto del Consumidor):**
   - El sistema debe emitir comprobantes (tiquetes, recibos) para toda transacción.
   - debe mostrar información clara de tarifa antes de procesar pago.
   - debe facilitar procedimiento de reclamo o duda por consumidor.

3. **Protección de Datos Personales:**
   - El sistema debe proteger placas vehiculares como dato personal sensible.
   - debe restringir acceso a datos de clientes solo a personal autorizado.
   - debe implementar políticas de retención conforme a ley de protección de datos.

### 2.4.2 Restricciones Técnicas y Arquitectónicas

1. **Operación Offline:**
   - El sistema debe mantener funcionalidad de recepción y salida sin conexión a internet.
   - debe sincronizar automáticamente al recuperar conectividad.
   - debe evitar conflictos de datos (transacciones duplicadas o perdidas).

2. **Integración con Medios de Pago:**
   - El sistema debe soportar múltiples medios (efectivo, tarjeta, transferencia, billetera digital).
   - debe mantener registro de todas las transacciones de pago.

3. **Infraestructura:**
   - El sistema operará en ambiente de parqueadero (exposición a condiciones climáticas, movimiento).
   - debe soportar dispositivos tipo tablet/terminal de punto de venta (POS).

### 2.4.3 Restricciones Operacionales

1. **Horario de Operación:**
   - Parqueadero operará 24 horas, 7 días a la semana.
   - Sistema debe mantener disponibilidad continua con máximo 0.5% downtime anual.

2. **Volumen de Transacciones:**
   - Estimado mínimo: 50 transacciones/día (recepción + salida).
   - Sistema debe soportar escalabilidad hasta 200 transacciones/día sin degradación de performance.

3. **Gestión de Capacidad:**
   - Parqueadero posee capacidad fija (ej., 100 espacios).
   - Sistema debe alertar cuando ocupación alcance 95%.

### 2.4.4 Restricciones de Metodología de Desarrollo

El desarrollo del Sistema de Gestión de Parqueaderos Públicos debe ejecutarse obligatoriamente bajo **metodología ágil** con ciclos iterativos:

1. **Metodología:** Scrum o Kanban.
   - **Scrum:** Sprints de 1-2 semanas con planificación, ejecución, revisión y retrospectiva.
   - **Kanban:** Flujo continuo con columnas de To-Do, In Progress, In Review, Done.

2. **Aplicabilidad:** Esta restricción aplica al equipo de desarrollo, garantizando entregas incrementales, validación frecuente con stakeholders, y adaptabilidad a cambios.

3. **Documentación Ágil:** Se mantiene documentación viva (actualizada en paralelo) sin priorizar documentación extensiva sobre software funcional.

### 2.4.5 Restricciones de Duración y Entregables

1. **Fase Inicial:** MVP (Producto Mínimo Viable) con funciones básicas de entrada, salida, tarifa.
   - Duración estimada: 8-12 semanas.
   - Entregables: Sistema funcional, manual de usuario, plan de capacitación.

2. **Fase Evolutiva:** Mejoras y extensiones (OCR, reportería avanzada, acceso cliente en línea).
   - Inicio: Post-MVP según decisión del propietario.

---

# 3. Requisitos específicos

## 3.1 Requerimientos Funcionales (RF)

Los siguientes requerimientos funcionales definen el comportamiento y acciones que el sistema DEBE ejecutar para cumplir con necesidades operativas y legales del parqueadero. Cada requisito está identificado únicamente y expresado en lenguaje prescriptivo (SHALL/DEBE).

---

### 3.1.1 Requerimientos de Acceso y Autenticación

#### [RF-ACCESO-001] Autenticación de Usuarios
El sistema DEBE permitir que usuarios (Administrador, Operador) se autentiquen mediante identificación única (usuario/email) y contraseña. El sistema DEBE validar credenciales contra la base de datos interna y DEBE registrar intentos de acceso (éxito y fallo) en el log de auditoría. La contraseña DEBE almacenarse cifrada (hash con salt) y DEBE forzar el cambio de contraseña en el primer acceso.

**Criterio de Aceptación:**
- Acceso exitoso con credenciales válidas.
- Rechazo de credenciales inválidas (usuario/contraseña incorrectos).
- Bloqueo temporal después de 3 intentos fallidos.
- Registro de auditoría con timestamp y usuario.

---

#### [RF-ACCESO-002] Gestión de Sesión
El sistema DEBE mantener una sesión activa durante la operación y DEBE terminar automáticamente la sesión después de 30 minutos de inactividad. El sistema DEBE presentar una advertencia con 5 minutos de anticipación al cierre de sesión y DEBE permitir la prórroga de la sesión por el usuario. Al cierre, DEBE limpiar datos en memoria y redirigir a la pantalla de inicio de sesión.

**Criterio de Aceptación:**
- Sesión activa durante interacción.
- Cierre automático tras 30 minutos sin actividad.
- Advertencia de cierre inminente a los 25 minutos.
- Limpieza de datos y cierre de sesión.

---

#### [RF-ACCESO-003] Gestión de Roles y Permisos
El sistema DEBE asignar a cada usuario un rol específico (Administrador, Operador) con permisos diferenciados. El Administrador DEBE tener acceso a todas las funciones. El Operador DEBE acceder únicamente a recepción, salida y visualización de sus propias transacciones. El sistema DEBE verificar permisos en cada acción y DEBE denegar acciones no autorizadas con un mensaje de error descriptivo.

**Criterio de Aceptación:**
- Admin accede a todas las opciones del menú.
- Operador accede solo a recepción, salida y transacciones.
- Denegación de acciones no autorizadas.
- Mensajes de error claros para intentos denegados.

---

### 3.1.2 Requerimientos de Recepción de Vehículos

#### [RF-RECEP-001] Registro de Entrada de Vehículo
El sistema DEBE capturar y registrar los siguientes datos al ingreso de un vehículo:
- **Placa vehicular:** Identificador único del vehículo (ej., AAA-123 o ABC123).
- **Hora de entrada:** Fecha y hora exacta del registro (timestamp).
- **Categoría del vehículo:** Selección entre Categoría A (liviano), B (medio), C (pesado) y Categoría D (motocicleta).
- **Nombre del propietario/conductor:** Texto libre, máximo 100 caracteres.
- **Teléfono de contacto (opcional):** Número telefónico del propietario.

El sistema DEBE validar que la placa no esté duplicada (vehículo ya presente en parqueadero). El sistema DEBE generar automáticamente un **ID de transacción único** (ej., TXN-20260505-00001) y DEBE asignar un **espacio de parqueo** (si gestión de espacios está habilitada). El sistema DEBE emitir inmediatamente un **tiquete de entrada** con la información capturada.

**Criterio de Aceptación:**
- Captura correcta de todos los datos de entrada.
- Validación de placa no duplicada.
- Generación de ID de transacción único.
- Emisión de tiquete con datos de entrada.
- Timestamp exacto de registro.

---

#### [RF-RECEP-002] Validación de Placa Vehicular
El sistema DEBE validar que el campo de placa ingresada siga el formato permitido según la normativa colombiana (letras + números, ej., AAA-123 o ABC123). El sistema DEBE rechazar placas con formato inválido mostrando un error descriptivo. El sistema DEBE verificar que la placa no esté ya registrada como presente en el parqueadero en ese momento.

**Criterio de Aceptación:**
- Acepta placas en formato válido.
- Rechaza placas con formato inválido.
- Detecta duplicados en parqueadero actual.
- Mensaje de error claro para placa ya presente.

---

---

#### [RF-RECEP-003] Lectura Asistida de Placa (Futuro - Opcional)
El sistema DEBE implementar una interfaz para captura de placa mediante OCR/Cámara (funcionalidad futura, opcional en MVP). Cuando esté habilitado, el sistema DEBE permitir:
- Captura manual de imagen de placa.
- Procesamiento automático para extraer texto de placa.
- Validación del texto extraído.
- Edición manual si OCR presenta incertidumbre.

**Criterio de Aceptación (cuando se implemente):**
- Carga de imagen desde cámara o archivo.
- Extracción de placa con precisión mínima 95%.
- Validación de formato de resultado.
- Opción de corrección manual.

---

#### [RF-RECEP-004] Generación de Tiquete de Entrada
El sistema DEBE generar automáticamente un **tiquete de entrada** inmediatamente después de registrar un vehículo. El tiquete DEBE incluir:
- **Fecha y hora de entrada** (timestamp exacto).
- **Placa del vehículo** (claramente visible).
- **ID de transacción** único del registro.
- **Categoría del vehículo** registrada.
- **Nombre del operador** que realizó el registro.
- **Términos de custodia:** Texto legal que establezca que el parqueadero asume responsabilidad por daño, robo, hurto o pérdida del vehículo, accesorios o contenido, según las condiciones contractuales del servicio.
- **Información de contacto del parqueadero** (teléfono, horarios).

El sistema DEBE permitir impresión inmediata del tiquete en impresora térmica (formato A6 o similar) o presentación en pantalla si cliente no requiere impreso. El tiquete DEBE ser **legible, profesional y contener información clara**.

**Criterio de Aceptación:**
- Tiquete genera automáticamente.
- Contiene todos los datos requeridos.
- Imprime correctamente en formato estándar.
- Términos de custodia legibles y claros.
- Información de contacto visible.

---

#### [RF-RECEP-005] Registro de Vehículos con Placas Internacionales
El sistema SHALL permitir al Operador registrar vehículos con placas internacionales cuando el formato no corresponda al estándar colombiano. En estos casos, el sistema DEBE aceptar identificadores alfanuméricos variados, incluyendo letras, números, guiones y espacios, siempre que la longitud total sea razonable para una placa vehicular. El sistema DEBE solicitar una descripción del vehículo para apoyar la clasificación operativa y DEBE permitir asignar Categoría A, B o C en función de dicha descripción cuando no exista un patrón de placa colombiano aplicable.

El sistema DEBE registrar como mínimo los siguientes datos para este tipo de vehículo:
- Identificador de placa o matrícula internacional.
- País o jurisdicción de origen, si es proporcionado por el Operador.
- Descripción del vehículo.
- Categoría operativa asignada (A, B o C).
- Hora de entrada y operador que realizó el registro.

El sistema DEBE conservar la validación de unicidad dentro del parqueadero para evitar duplicados de matrícula internacional durante la misma permanencia. El sistema DEBE emitir un tiquete de entrada con la identificación registrada y la categoría asignada.

**Criterio de Aceptación:**
- El sistema acepta placas internacionales con formatos alfanuméricos no colombianos.
- El Operador puede clasificar el vehículo en Categoría A, B o C usando la descripción.
- El sistema rechaza registros duplicados de la misma matrícula durante la permanencia.
- El tiquete de entrada refleja la identificación y categoría asignada.

---

### 3.1.3 Requerimientos de Salida y Tarificación

#### [RF-SALIDA-001] Registro de Salida de Vehículo
El sistema SHALL permitir al operador registrar la salida de un vehículo mediante:
- Búsqueda del registro de entrada por **placa** o **ID de transacción**.
- Validación de que el vehículo está presente en el parqueadero.
- Captura automática de **hora de salida** exacta (timestamp).
- Cálculo automático de **duración del parqueo** (hora salida - hora entrada).

El sistema DEBE presentar el registro de entrada encontrado y DEBE calcular la tarifa a cobrar basada en duración y categoría. El sistema DEBE mostrar al operador un **resumen de cobro** antes de procesar pago, permitiendo confirmación o cancelación.

**Criterio de Aceptación:**
- Búsqueda exacta por placa o transacción.
- Validación de presencia del vehículo.
- Cálculo correcto de duración.
- Presentación de resumen de cobro.
- Opción de confirmar o cancelar.

---

#### [RF-SALIDA-002] Cálculo de Tarifa por Duración
El sistema SHALL calcular la tarifa de estacionamiento aplicando la siguiente lógica:

**Fórmula Base:**
```
Tarifa = Tarifa_Categoria × Duración_Redondeada
```

Donde:
- **Tarifa_Categoria** = tarifa por hora configurada para la categoría del vehículo (A, B, C, D) en COP (pesos colombianos).
- **Duración_Redondeada** = duración del parqueo redondeada al próximo valor entero de horas.
  - Fracción ≤ 0 minutos = 0 horas (primer 15 minutos gratis).
  - Fracción > 0 y ≤ 60 minutos = 1 hora completa.
  - Más de 1 hora + fracción = redondeo hacia arriba.
  - Ejemplo: 2 horas 30 minutos = 3 horas; 3 horas 15 minutos = 4 horas.

El sistema DEBE permitir configuración de reglas de redondeo por categoría. El sistema DEBE presentar desglose de cálculo al operador:
```
Duración: 2h 45m
Tarifa por hora (Categoría B): $8,000
Duración redondeada: 3 horas
Tarifa total: $24,000
```

El sistema DEBE aplicar para la Categoría D una tarifa por hora específica para motocicletas, configurada por el Admin en la sección de tarifas. Si no existe una tarifa activa para Categoría D, el sistema DEBE impedir el cálculo y mostrar un error descriptivo hasta que la tarifa sea definida.

**Criterio de Aceptación:**
- Cálculo correcto de duración.
- Redondeo según regla especificada.
- Aplicación correcta de tarifa configurada.
- Presentación clara de desglose.
- Permitir ajustes por admin si fuera necesario.

---

#### [RF-SALIDA-004] Procesamiento de Pago
El sistema SHALL registrar el método de pago seleccionado por cliente/operador:
- **Efectivo:** Registro de monto recibido, cambio a dar.
- **Tarjeta de crédito/débito:** Validación de datos, procesamiento a través de gateway de pago.
- **Transferencia bancaria:** Generación de referencia de pago, notificación.
- **Billetera digital:** Integración con aplicaciones de pago móvil.

El sistema DEBE validar que el monto pagado cubra la tarifa total. Si pago es en efectivo, DEBE calcular y registrar cambio a devolver. El sistema DEBE generar **constancia de transacción** con timestamp y método de pago. El sistema DEBE marcar el vehículo como **"salido"** y liberar el espacio de parqueo.

**Criterio de Aceptación:**
- Registro correcto del método de pago.
- Validación de monto suficiente.
- Cálculo correcto de cambio (efectivo).
- Generación de constancia.
- Liberación de espacio/marca de salida.

---

#### [RF-SALIDA-005] Generación de Recibo de Salida
El sistema SHALL generar automáticamente un **recibo de salida** al completar el pago. El recibo DEBE incluir:
- **Fecha y hora de salida** (timestamp exacto).
- **Placa del vehículo**.
- **ID de transacción**.
- **Hora de entrada y hora de salida**.
- **Duración total** del parqueo.
- **Categoría del vehículo**.
- **Tarifa por hora aplicada**.
- **Duración redondeada y cálculo de tarifa** (con desglose).
- **Descuentos aplicados** (si los hay).
- **Total a pagar** en COP.
- **Método de pago** utilizado.
- **Nombre del operador** que procesó la salida.
- **Información de contacto del parqueadero**.

El recibo DEBE ser **imprimible en formato estándar** (A6 o similar) y DEBE poder emitirse también en formato digital (PDF). El operador DEBE poder entregar recibo al cliente y DEBE conservarse copia digital en el sistema.

**Criterio de Aceptación:**
- Recibo genera automáticamente.
- Contiene todos los datos requeridos.
- Imprime correctamente en formato estándar.
- Cálculos reflejados con precisión.
- Copia digital archivada en sistema.

---

### 3.1.4 Requerimientos de Gestión de Tarifas

#### [RF-TARIFA-001] Configuración de Tarifas por Categoría
El sistema SHALL permitir al Admin configurar **tarifas por hora** para cada categoría de vehículo:
- **Categoría A (Livianos):** Tarifa en COP/hora (ej., $5,000).
- **Categoría B (Medios):** Tarifa en COP/hora (ej., $8,000).
- **Categoría C (Pesados):** Tarifa en COP/hora (ej., $12,000).
- **Categoría D (Motocicletas):** Tarifa en COP/hora (ej., $3,000).

El Admin DEBE poder:
1. **Crear nueva estructura tarifaria** con nombre, descripción y vigencia (fecha inicio - fecha fin).
2. **Modificar tarifas existentes** antes de activación.
3. **Activar una estructura tarifaria** en fecha/hora específica (ej., a partir del 1° de junio).
4. **Visualizar histórico de cambios tarifarios** con fechas de vigencia y quién realizó cambios.
5. **Desactivar tarifas obsoletas** para reportería histórica.

El sistema DEBE validar que:
- Las tarifas sean valores monetarios positivos.
- No haya períodos de vigencia solapados para la misma categoría (solo una tarifa activa por categoría en cualquier momento, incluyendo Categoría D).
- Cambios tarifarios futuros no interfieran con transacciones actuales.

**Criterio de Aceptación:**
- Admin crea, modifica, activa tarifas correctamente.
- Histórico de tarifas es auditable.
- Validaciones evitan conflictos y datos inválidos.
- Sistema aplica tarifa vigente al momento de cálculo.

---

#### [RF-TARIFA-002] Vigencia Temporal de Tarifas
El sistema SHALL aplicar **tarifas según vigencia temporal**. En cualquier momento, el sistema DEBE:
1. Identificar cuál es la estructura tarifaria **activa** (vigente en fecha/hora actual).
2. Aplicar la tarifa activa al calcular cobros de salida.
3. Para transacciones que crucen cambio de tarifa (entrada en tarifa antigua, salida en tarifa nueva), DEBE permitir admin decidir:
   - Aplicar tarifa de entrada (más favorable al cliente).
   - Aplicar tarifa de salida (más favorable al operador).
   - Aplicar tarifa promedio o mixta.

El sistema DEBE permitir cambios tarifarios efectivos a partir de medianoche o en horarios específicos (ej., 1° de mes, 1° de semana).

**Criterio de Aceptación:**
- Identifica tarifa activa correctamente.
- Aplica tarifa vigente a cálculos.
- Maneja transiciones de tarifas sin ambigüedad.
- Admin configura política de aplicación.

---

#### [RF-TARIFA-003] Actualización de Tarifas con Notificación
El sistema DEBE notificar cambios tarifarios:
1. **Aviso Interno:** Mostrar al Admin notificación de cambio tarifario próximo (5 días antes).
2. **Aviso a Operadores:** Mostrar en pantalla de login o dashboard del Operador que tarifas cambiarán (1 día antes).
3. **Aviso a Clientes (Futuro):** Mostrar en tiquete/recibo información de tarifas vigentes.

El Admin DEBE poder previsualizar el impacto tarifario (ej., "Tarifa Cat. A sube de $5,000 a $6,000, aumentando ingresos esperados 20%").

**Criterio de Aceptación:**
- Notificaciones se generan con anticipación requerida.
- Operadores ven aviso claro en sistema.
- Histórico de notificaciones es auditable.

---

#### [RF-TARIFA-004] Modalidades Tarifarias Diferenciadas
El sistema SHALL soportar **cuatro modalidades de cobro** configurables por el Admin para cada categoría de vehículo (A, B, C, D):

**1. Tarifa por Hora (Estándar):**
- Precio fijo por cada hora o fracción redondeada.
- Ejemplo: Categoría A = $5,000/hora.
- Política de redondeo configurable (próxima hora completa).
- Primeros 15 minutos gratis (configurable).

**2. Tarifa por Fracción de Hora:**
- El Admin DEBE poder configurar precios para fracciones de 15, 30 y 45 minutos.
- Ejemplo: Categoría A = $1,500 (15 min), $2,800 (30 min), $4,000 (45 min).
- El sistema DEBE calcular automáticamente la fracción aplicable según duración real.
- Si la duración excede la fracción mayor configurada, se aplica tarifa por hora.
- El sistema DEBE permitir habilitar/deshabilitar esta modalidad por categoría.

**3. Mensualidad (Suscripción Mensual):**
- El Admin DEBE poder registrar **suscripciones mensuales** para clientes frecuentes.
- Cada suscripción DEBE incluir:
  - Placa del vehículo suscriptor.
  - Categoría del vehículo.
  - Fecha de inicio y fecha de fin del mes cubierto.
  - Monto mensual pagado en COP.
  - Estado: activa, vencida, cancelada.
- El sistema DEBE validar que la suscripción esté **activa** al momento de registrar entrada.
- Si la suscripción está activa, el sistema DEBE registrar la entrada **sin cobro** (tarifa = $0).
- El sistema DEBE notificar al cliente y al Admin **5 días antes del vencimiento** de la mensualidad.
- El sistema DEBE permitir renovación anticipada de mensualidad.

**4. Abono (Crédito Prepagado):**
- El Admin DEBE poder vender **abonos** (crédito prepagado) a clientes.
- Cada abono DEBE incluir:
  - Placa del vehículo asociada.
  - Saldo disponible en COP o en horas (ej., $50,000 o 10 horas).
  - Fecha de compra y fecha de vencimiento del abono.
  - Estado: activo, agotado, vencido.
- Al registrar salida, el sistema DEBE ofrecer al operador la opción de **cobrar contra el abono**.
- Si el abono tiene saldo suficiente, el sistema DEBE descontar el monto y registrar la transacción como pagada.
- Si el abono tiene saldo insuficiente, el sistema DEBE permitir **pago mixto** (abono + efectivo/tarjeta por la diferencia).
- El sistema DEBE notificar al cliente cuando el saldo del abono esté por debajo del 20%.
- El sistema DEBE permitir recarga del abono en cualquier momento.

**Prioridad de Aplicación de Tarifas:**
Cuando un vehículo tiene múltiples modalidades disponibles, el sistema DEBE aplicar en este orden:
1. **Mensualidad activa** → Tarifa $0 (sin cobro).
2. **Abono con saldo** → Descontar del abono (o pago mixto).
3. **Tarifa por fracción** → Si está habilitada y duración ≤ fracción mayor.
4. **Tarifa por hora** → Modalidad por defecto.

**Validaciones del Sistema:**
- No permitir solapamiento de mensualidades para la misma placa.
- No permitir abonos con saldo negativo.
- No permitir mensualidades con fecha de inicio en el pasado.
- Validar que la placa del suscriptor/abonado coincida con el vehículo que ingresa.

**Criterio de Aceptación:**
- Admin configura las 4 modalidades sin errores.
- Sistema aplica prioridad de tarifas correctamente.
- Mensualidad activa permite entrada sin cobro.
- Abono descuenta saldo correctamente.
- Pago mixto funciona cuando abono es insuficiente.
- Notificaciones de vencimiento se generan 5 días antes.
- Recarga de abono actualiza saldo inmediatamente.
- Histórico de modalidades es auditable.

---

### 3.1.5 Requerimientos de Compliance Legal

#### [RF-LEGAL-001] Generación de Tiquete con Términos de Custodia
El sistema SHALL incluir en cada **tiquete de entrada** un apartado legal con **términos de custodia** que aclare al cliente:

**Texto Legal Obligatorio (ejemplo):**
```
AVISO IMPORTANTE DE CUSTODIA:
- Este parqueadero ES RESPONSABLE por daño, robo, hurto o pérdida de 
   vehículos, accesorios o contenido dentro del vehículo, conforme a las
   condiciones del servicio y la normativa aplicable.
- La custodia del vehículo comprende la protección razonable de la unidad y
   de sus contenidos mientras permanezca en las instalaciones.
- Para reclamos por daño, robo, hurto o pérdida: Contactar en 24 horas a 
   [TELÉFONO/EMAIL].
```

El sistema DEBE:
1. **Permitir al Admin personalizar** el texto legal según normativa local.
2. **Imprimir el texto** en el tiquete de forma legible (mínimo 8 puntos de fuente).
3. **Mantener versión de cambios legales** con auditoría de quién y cuándo modificó.
4. **Generar reporte de cumplimiento** que certifique que todos los tiquetes incluyen términos de custodia.

**Criterio de Aceptación:**
- Tiquetes incluyen términos de custodia legibles.
- Admin puede personalizar términos.
- Histórico de versiones es auditable.
- Reporte de cumplimiento disponible.

---

#### [RF-LEGAL-002] Checklist Legal de Pre-Operación
El sistema SHALL implementar un **Checklist Legal de Pre-Operación** que el Admin DEBE completar antes de iniciar operaciones:

**Elementos Requeridos en Checklist:**

1. **Validación de Normativa:**
   - ☐ Ley 1801/2016 revisada y entendida.
   - ☐ Ley 1480/2011 revisada y entendida.
   - ☐ Ley de Protección de Datos revisada.

2. **Documentación Legal:**
   - ☐ Términos de custodia redactados y aprobados legalmente.
   - ☐ Política de privacidad y protección de datos elaborada.
   - ☐ Política de tratamiento de reclamos documentada.

3. **Configuración del Sistema:**
   - ☐ Tarifas configuradas y aprobadas.
   - ☐ Roles y permisos de usuarios asignados.
   - ☐ Impresoras/dispositivos de recepción configurados.
   - ☐ Medio de pago configurado.

4. **Capacitación:**
   - ☐ Operadores capacitados en uso del sistema.
   - ☐ Admin capacitado en auditoría y reportería.
   - ☐ Registro de capacitación completado.

El Admin DEBE confirmar cada ítem (checkbox). El sistema DEBE impedir inicio de operaciones hasta que ALL items estén confirmados. El sistema DEBE generar un **certificado de cumplimiento de pre-operación** con fecha, firma digital del Admin, y archivo en sistema.

**Criterio de Aceptación:**
- Checklist es exhaustivo y verificable.
- Sistema bloquea operación sin checklist completo.
- Certificado genera automáticamente.
- Histórico de checklists es auditable.

---

#### [RF-LEGAL-003] Protección de Datos Personales (Placa Vehicular)
El sistema SHALL clasificar **placas vehiculares como dato personal sensible** y DEBE implementar protecciones especiales:

1. **Restricción de Acceso:**
   - Solo usuarios autorizados (Admin, Operador en su turno) acceden a placas.
   - Cliente NO puede ver placas de otros vehículos.
   - Acceso a datos históricos requiere justificación (auditoría).

2. **Cifrado en Almacenamiento:**
   - Las placas DEBEN almacenarse cifradas en base de datos.
   - Descifrado ocurre solo cuando es necesario (visualización en operación).

3. **Enmascaramiento en Reportes:**
   - Reportes de ocupación pueden mostrar placas.
   - Reportes de ingresos por vehículo PUEDEN mostrar placas parcialmente (ej., "AAA-***").

4. **Retención de Datos:**
   - Las transacciones DEBEN archivarse por mínimo 2 años (cumplimiento legal).
   - Después de 2 años, Admin PUEDE solicitar eliminación segura (borrado con cifrado).
   - Sistema DEBE registrar fecha de eliminación en auditoría.

5. **Acceso y Auditoría:**
   - Todo acceso a datos de clientes DEBE registrarse en log (quién, cuándo, qué).
   - Admin PUEDE generar reporte de accesos para auditoría.

**Criterio de Aceptación:**
- Acceso a placas restringido por rol.
- Cifrado en almacenamiento implementado.
- Enmascaramiento en reportes funciona.
- Política de retención cumplida.
- Auditoría de accesos registra todos los eventos.

---

#### [RF-LEGAL-004] Política de Tratamiento de Reclamos
El sistema SHALL implementar un módulo de **registro y seguimiento de reclamos** del cliente:

1. **Registro de Reclamo:**
   - Cliente/Operador puede registrar reclamo con descripción, fecha, categoría (daño, cobro incorrecto, otro).
   - Sistema genera ID de reclamo único.
   - DEBE almacenar evidencia (fotos, archivos adjuntos si es posible).

2. **Seguimiento:**
   - Admin puede visualizar reclamos pendientes, en investigación, resueltos.
   - Sistema notifica a Admin de reclamos nuevos.
   - Admin asigna responsable, registra notas de investigación.

3. **Resolución:**
   - Admin registra decisión (rechazado, aceptado con compensación, otro).
   - Sistema archiva resolución con fecha y justificación.
   - Generar comunicación a cliente con resolución.

4. **Conformidad Legal:**
   - Sistema asegura que reclamo es respondido dentro de plazo legal (ej., 30 días).
   - Reporte de reclamos para auditoría externa si fuera requerido.

**Criterio de Aceptación:**
- Reclamo registra con todos los datos.
- Seguimiento y resolución documentados.
- Notificaciones funcionan.
- Cumplimiento de plazos verificable.

---

### 3.1.6 Requerimientos de Reportería

#### [RF-REPORT-001] Reporte de Ocupación
El sistema SHALL generar un **reporte de ocupación** que muestre:

**Información del Reporte:**
- Fecha y período (día, semana, mes).
- Total de espacios disponibles en parqueadero.
- Número de espacios ocupados (actual).
- Número de espacios libres (actual).
- Porcentaje de ocupación (actual).
- Histórico de ocupación por hora (gráfica de línea).
- Hora pico (máxima ocupación).
- Hora valle (mínima ocupación).
- Duración promedio de parqueo.

**Opciones de Generación:**
- Admin puede generar reporte bajo demanda.
- Sistema genera automáticamente reporte diario a medianoche y lo archiva.
- Reportes pueden exportarse en CSV, PDF, Excel.

**Criterio de Aceptación:**
- Reporte calcula ocupación correctamente.
- Gráficas visualizan tendencias.
- Exportación funciona en múltiples formatos.
- Histórico de reportes se mantiene por mínimo 1 año.

---

#### [RF-REPORT-002] Reporte de Ingresos
El sistema SHALL generar un **reporte de ingresos** que muestre:

**Información del Reporte:**
- Período (día, semana, mes, custom).
- Ingresos totales en COP.
- Desglose por categoría de vehículo (A, B, C, D):
  - Número de transacciones.
  - Ingresos por categoría.
  - Promedio por transacción.
- Desglose por método de pago (efectivo, tarjeta, etc.).
- Descuentos otorgados (total y por razón).
- Ingresos netos (total - descuentos).
- Comparación con período anterior (variación porcentual).

**Opciones de Generación:**
- Bajo demanda del Admin.
- Automático al cierre de cada día.
- Exportable en CSV, PDF, Excel.

**Criterio de Aceptación:**
- Cálculos correctos de ingresos.
- Desglose por categoría y método de pago.
- Comparativas y tendencias visibles.
- Exportación funciona.

---

#### [RF-REPORT-003] Reporte de Transacciones y Auditoría
El sistema SHALL generar un **reporte de auditoría completo** que muestre:

**Información del Reporte:**
- Período seleccionable (día, semana, mes, custom).
- Listado de TODAS las transacciones (entrada + salida) con:
  - ID de transacción.
  - Placa del vehículo.
  - Hora de entrada y salida.
  - Duración.
  - Categoría.
  - Tarifa aplicada.
  - Descuentos.
  - Pago total.
  - Método de pago.
  - Operador que procesó.
  - Status (completada, cancelada, error).

**Filtrado y Búsqueda:**
- Por rango de fechas.
- Por operador.
- Por método de pago.
- Por categoría de vehículo.
- Por placa (búsqueda de vehículo específico).
- Por monto (rango de tarifas).

**Acceso Controlado:**
- Solo Admin puede generar reporte completo.
- Operador puede ver solo sus propias transacciones.

**Exportación:**
- CSV, PDF, Excel.

**Criterio de Aceptación:**
- Reporte incluye todas las transacciones.
- Filtrado funciona correctamente.
- Búsqueda de placa retorna resultados exactos.
- Exportación mantiene formato e integridad de datos.

---

#### [RF-REPORT-004] Reporte de Actividad de Usuarios
El sistema SHALL generar un **reporte de actividad de usuarios** que muestre:

**Información del Reporte:**
- Período seleccionable.
- Por cada usuario (operador):
  - Nombre.
  - Número de transacciones procesadas (entrada, salida).
  - Ingresos totales gestionados.
  - Descuentos autorizados (cantidad y total COP).
  - Número de errores/cancelaciones.
  - Horas trabajadas (según log de login/logout).
  - Último acceso al sistema.

**Análisis de Productividad:**
- Operador promedio (transacciones/hora, ingresos/hora).
- Operador más productivo.
- Operador con más descuentos (control de abuso).

**Acceso:**
- Solo Admin puede generar este reporte.

**Criterio de Aceptación:**
- Datos de actividad son exactos.
- Permite análisis de productividad.
- Detecta posibles anomalías (muchos descuentos, errores).
- Exportable.

---

#### [RF-REPORT-005] Reporte de Cumplimiento Legal
El sistema SHALL generar un **reporte de cumplimiento legal** que certifique:

1. **Emisión de Tiquetes:**
   - % de transacciones de entrada que generaron tiquete.
   - % de transacciones de salida que generaron recibo.
   - Transacciones sin tiquete/recibo (anómalo).

2. **Inclusión de Términos de Custodia:**
   - % de tiquetes que incluyeron términos de custodia.
   - Histórico de versiones de términos de custodia.

3. **Protección de Datos:**
   - Número de accesos a datos de clientes.
   - Número de eliminaciones de datos (por vencimiento).
   - Auditoría de accesos anómalos.

4. **Cumplimiento de Plazos (Reclamos):**
   - Número de reclamos abiertos.
   - Número de reclamos resueltos en plazo (dentro de 30 días).
   - Reclamos vencidos sin resolución (incumplimiento).

**Usos:**
- Auditoría interna del propietario.
- Presentación ante autoridades de control (si requerido).

**Criterio de Aceptación:**
- Reporte es exhaustivo en cumplimiento.
- Datos pueden ser certificados (firma digital, timestamp).
- Exportable para auditoría externa.

---

### 3.1.7 Requerimientos de Operación Offline

#### [RF-OFFLINE-001] Operación Básica sin Internet
El sistema SHALL mantener funcionalidad **crítica** sin conexión a internet:

**Funciones Disponibles Offline:**
- Registro de entrada de vehículos (captura placa, hora, categoría, datos propietario).
- Generación de tiquete de entrada (impresión local).
- Búsqueda de vehículo para registro de salida.
- Cálculo de tarifa.
- Registro de salida (captura hora de salida, actualización de status).
- Generación de recibo de salida (impresión local).
- Procesamiento de pago en efectivo (registro sin conexión a gateway).

**Funciones NO Disponibles Offline:**
- Procesamiento de pago con tarjeta (requiere conexión a gateway).
- Generación de reportes (requiere acceso a base de datos en servidor).
- Actualización de tarifas (requiere sincronización con servidor).
- Acceso a histórico de transacciones.

**Sincronización Automática:**
- Cuando sistema recupere conexión a internet, DEBE sincronizar automáticamente todas las transacciones acumuladas offline.
- DEBE validar que no haya conflictos (ej., transacciones duplicadas).
- DEBE registrar timestamp de sincronización.

**Almacenamiento Local:**
- El sistema DEBE almacenar transacciones en **base de datos local** (SQLite, Realm, u similar) en dispositivo.
- Base de datos local DEBE estar **cifrada** para proteger datos.

**Indicador de Conexión:**
- Sistema DEBE mostrar estado de conectividad en interfaz (ej., icono de WiFi).
- DEBE advertir al usuario si hay transacciones pendientes de sincronizar.

**Criterio de Aceptación:**
- Funciones críticas operan sin internet.
- Sincronización automática sin pérdida de datos.
- No hay transacciones duplicadas post-sincronización.
- Base de datos local está cifrada.

---

#### [RF-OFFLINE-002] Resolución de Conflictos de Sincronización
El sistema SHALL implementar mecanismo para resolver conflictos cuando **una transacción fue procesada tanto offline como online** (caso raro pero posible):

**Escenario de Conflicto:**
1. Vehículo registra entrada (offline).
2. Se genera tiquete (offline).
3. Luego, sistema sincroniza y descubre que esa misma transacción ya existe en servidor (transacción duplicada).

**Resolución:**
- Sistema DEBE detectar transacción duplicada (comparar placa + timestamp de entrada).
- DEBE preservar la transacción más antigua (primera registrada).
- DEBE descartar o marcar como cancelada la transacción duplicada.
- DEBE generar reporte de conflictos para revisión del Admin.
- Admin DEBE poder revisar y resolver manualmente si fuera necesario.

**Criterio de Aceptación:**
- Conflictos se detectan automáticamente.
- Resolución automática evita duplicados.
- Reporte de conflictos disponible.
- Admin puede revisar casos manuales.

---

### 3.1.8 Requerimientos de Gestión de Espacios (Opcional)

#### [RF-ESPACIO-001] Asignación de Espacios de Parqueo
El sistema SHALL (si gestión de espacios está habilitada) asignar automáticamente un espacio numérico a cada vehículo que ingresa:

**Funcionalidad:**
- Admin configura número total de espacios (ej., 100).
- Sistema mantiene registro de espacios ocupados/libres.
- Al registrar entrada, sistema asigna automáticamente el primer espacio disponible.
- Sistema muestra al operador: "Espacio asignado: A-15" en tiquete de entrada.
- Al registrar salida, sistema libera el espacio.

**Alertas:**
- Sistema DEBE alertar cuando ocupación alcanza 90%, 95%, 99%.
- DEBE indicar cuando parqueadero está lleno (0 espacios disponibles).

**Reporte de Espacios:**
- Admin puede visualizar matriz de ocupación (gráfica o tabla con estado de cada espacio).

**Criterio de Aceptación:**
- Asignación automática funciona sin conflictos.
- Liberación al salir es inmediata.
- Alertas se disparan en los umbrales correctos.
- Matriz de ocupación es visualizable.

---

### 3.1.9 Requerimientos de Integración y Extensiones

#### [RF-INTEG-001] API REST para Consultas Externas (Futuro)
El sistema DEBE (en fase evolutiva) exponer una **API REST** para permitir que sistemas externos realicen consultas:

**Endpoints Posibles:**
- `GET /api/parking/status` → Estado actual de ocupación.
- `GET /api/parking/vehicle/{plate}` → Información de vehículo (si está parqueado).
- `GET /api/parking/rates` → Tarifas vigentes.
- `POST /api/parking/entry` → Registrar entrada (integración con portería).
- `POST /api/parking/exit` → Registrar salida.
- `GET /api/parking/transactions` → Listado de transacciones (con autenticación).

**Seguridad:**
- Autenticación mediante API Key o OAuth.
- Rate limiting para evitar abuso.
- Cifrado HTTPS obligatorio.
- Acceso controlado por rol del cliente API.

**Criterio de Aceptación (cuando se implemente):**
- Endpoints funcionales y documentados.
- Autenticación segura.
- Respuestas en JSON válido.
- Rate limiting protege servidor.

---

### 3.1.10 Requerimientos de Consulta Digital por Cliente

#### [RF-CLIENTE-001] Consulta Segura de Historial de Parqueos
El sistema SHALL proporcionar una **interfaz de consulta digital segura** que permita al cliente autenticado visualizar su historial completo de transacciones de parqueo. El cliente DEBE poder acceder a esta funcionalidad mediante un rol específico diferente del Operador y del Admin, con acceso restringido exclusivamente a sus propias transacciones.

**Mecanismos de Autenticación:**
El sistema DEBE implementar autenticación segura para clientes mediante:
- **Email y Contraseña:** El cliente proporciona email registrado y contraseña para acceder a su historial.
- **Código de Acceso de Transacción:** El cliente proporciona ID de transacción (ej., TXN-20260505-00001) + últimos 4 dígitos de placa para validar acceso a una transacción específica (sin crear cuenta).
- **Autenticación de Dos Factores (2FA) - Futuro:** SMS o email de confirmación adicional para mayor seguridad.

La sesión de cliente DEBE expirar automáticamente tras 20 minutos de inactividad. El sistema DEBE registrar todos los intentos de acceso en auditoría.

**Datos Visibles en Historial:**
El cliente DEBE poder visualizar el siguiente historial de parqueos con filtrado y búsqueda:
- **ID de Transacción:** Identificador único (ej., TXN-20260505-00001).
- **Placa del Vehículo:** Identificación completa del vehículo parqueado.
- **Categoría del Vehículo:** Categoría asignada (A, B, C o D).
- **Hora de Entrada:** Fecha y hora exacta de ingreso (formato: DD de MMM de YYYY, HH:MM).
- **Hora de Salida:** Fecha y hora exacta de salida (formato: DD de MMM de YYYY, HH:MM).
- **Duración Total:** Tiempo total de estacionamiento en horas y minutos (ej., 2h 45m).
- **Tarifa por Hora:** Precio unitario aplicado (ej., $8,000).
- **Duración Redondeada:** Horas cobradas según política de redondeo.
- **Tarifa Total:** Total a pagar en COP.
- **Descuentos Aplicados:** Si existen, nombre del descuento y monto (ej., "Cortesía Operador: -$5,000").
- **Método de Pago:** Efectivo, tarjeta, transferencia, billetera digital.
- **Estado de la Transacción:** Completada, Cancelada, Pendiente.
- **Fecha de Consulta:** Timestamp de cuándo el cliente consultó este historial.

**Funcionalidades de Consulta:**
El cliente DEBE poder:
1. **Visualizar historial completo** ordenado cronológicamente (más reciente primero).
2. **Filtrar por rango de fechas:** Especificar período (desde - hasta) para búsqueda.
3. **Buscar por placa:** Ingresar placa para localizar transacciones de ese vehículo.
4. **Buscar por ID de transacción:** Ingresar ID único para encontrar transacción específica.
5. **Filtrar por categoría:** Ver solo parqueos de categoría A, B, C o D.
6. **Exportar historial:** Descargar historial en formato PDF o CSV con período seleccionado.
7. **Ver detalles expandidos:** Hacer clic en transacción para ver información completa (tarifa desglosada, condiciones operativas).

**Restricciones de Seguridad y Privacidad:**
El sistema DEBE:
1. Permitir que el cliente VEA ÚNICAMENTE sus propias transacciones (filtrado por email de cliente o placa registrada).
2. NO mostrar datos de otros clientes, incluso si intenta manipular parámetros de URL o solicitud.
3. Registrar todos los accesos a historial en auditoría (quién accedió, cuándo, qué transacciones vio).
4. Implementar rate limiting: máximo 10 consultas por minuto por cliente para evitar abuso.
5. Cifrar toda comunicación con cliente (HTTPS/TLS 1.3 mínimo).
6. NO almacenar credenciales en caché o cookies sin cifrado.
7. Generar token de sesión seguro (JWT con firma, válido solo 20 minutos).

**Interfaz de Presentación:**
La interfaz DEBE ser:
- **Responsiva:** Funcionar en computadora de escritorio, tablet y dispositivo móvil.
- **Clara y legible:** Tabla o lista con información bien organizada (columnas claramente etiquetadas).
- **Accesible:** Cumplir estándares WCAG AA (contraste mínimo 4.5:1, navegable por teclado).
- **En español colombiano:** Todos los textos, fechas y moneda en formato local.

**Ejemplo de Pantalla de Historial:**
```
HISTORIAL DE MIS PARQUEOS
─────────────────────────────────────────────────────────────────────
Hola, JUAN PÉREZ | Cerrar Sesión

FILTROS:
[Desde: 01/04/2026] [Hasta: 05/05/2026] [Placa: ___________]
[Buscar] [Limpiar Filtros]

TRANSACCIONES:

| ID Transacción | Placa   | Categoría | Entrada       | Salida        | Duración | Total  | Estado      | Acción    |
|----------------|---------|-----------|---------------|---------------|----------|--------|-------------|-----------|
| TXN-26050512   | AAA-123 | A (Liviano)| 05 MAY, 10:15 | 05 MAY, 13:00 | 2h 45m   | $24,000| Completada | [Ver] [PDF] |
| TXN-26050411   | AAA-123 | A (Liviano)| 04 MAY, 08:30 | 04 MAY, 17:45 | 9h 15m   | $68,000| Completada | [Ver] [PDF] |
| TXN-26040310   | AAA-123 | A (Liviano)| 03 ABR, 15:20 | 04 ABR, 02:10 | 10h 50m  | $75,000| Completada | [Ver] [PDF] |

Total transacciones: 47 | Mostrando 1-3
[Anterior] [1] [2] ... [16] [Siguiente]

[Descargar Historial (PDF)] [Descargar Historial (CSV)]
─────────────────────────────────────────────────────────────────────
```

**Criterio de Aceptación:**
- El cliente autenticado accede a su historial sin ver datos de otros clientes.
- El historial muestra todos los campos especificados con precisión.
- Filtrado por fecha, placa e ID de transacción funciona correctamente.
- Exportación a PDF y CSV genera archivos válidos.
- Auditoría registra todos los accesos a historial.
- Interfaz es responsiva y accesible en múltiples dispositivos.
- Rate limiting protege contra intentos de abuso.
- Sesión expira automáticamente tras 20 minutos de inactividad.

---

### 3.1.11 Requerimientos de Configuración de Perfil de Usuario

#### [RF-PERFIL-001] Acceso y Visualización de Configuración de Perfil
El sistema SHALL proporcionar un **módulo de Configuración de Perfil** accesible a todos los usuarios autenticados (Admin/Propietario, Operador, Cliente) mediante un menú de usuario o botón de perfil. El módulo DEBE mostrar información personal del usuario y opciones de personalización sin afectar el funcionamiento global del sistema ni comprometer datos de otros usuarios.

El usuario DEBE poder acceder a su configuración de perfil mediante:
- Menú hamburguesa o icono de perfil en esquina superior derecha.
- Opción "Mi Perfil" o "Configuración Personal" en el dashboard.
- Acceso directo `/profile` o similar en interfaz web.

La configuración de perfil DEBE presentar secciones claramente diferenciadas:
1. **Información Personal:** Datos inmutables del usuario (nombre, email, rol, fecha de creación de cuenta).
2. **Preferencias de Notificación:** Opciones para activar/desactivar notificaciones por tipo.
3. **Seguridad:** Cambio de contraseña, gestión de sesiones activas.
4. **Idioma y Formato:** Selección de idioma (futuro: multi-idioma) y formato de fecha/moneda.
5. **Datos y Privacidad:** Información de qué datos posee la cuenta y opciones de exportación (futuro).

**Criterio de Aceptación:**
- Usuario accede a perfil sin errores.
- Todas las secciones son visualizables y claras.
- Cambios guardados correctamente sin afectar otras funciones.
- Usuario puede salir de perfil sin perder cambios guardados.

---

#### [RF-PERFIL-002] Gestión de Notificaciones Personalizadas
El sistema SHALL permitir que cada usuario configure notificaciones personalizadas según su rol, sin afectar notificaciones de otros usuarios.

**Tipos de Notificaciones Disponibles:**

**Para Admin/Propietario:**
- ☐ Notificación de cambio tarifario próximo (5 días de anticipación).
- ☐ Notificación de ocupación cercana a capacidad máxima (95%, 99%).
- ☐ Notificación de parqueadero lleno (0 espacios disponibles).
- ☐ Notificación de error del sistema o fallo de sincronización.
- ☐ Notificación de reclamo nuevo de cliente.
- ☐ Notificación de acceso no autorizado intentado.
- ☐ Resumen diario de ingresos (reporte automático).
- ☐ Notificación de operador nuevo o cambio de rol.

**Para Operador:**
- ☐ Notificación de cambio tarifario próximo (1 día de anticipación).
- ☐ Notificación de parqueadero lleno (0 espacios disponibles).
- ☐ Notificación de error en procesamiento de pago (fallo de gateway).
- ☐ Notificación de impresora offline (no puede imprimir tiquete).
- ☐ Notificación de fin de sesión inminente (5 minutos antes de cierre).
- ☐ Notificación de transacción completada (confirmación de salida).

**Para Cliente:**
- ☐ Notificación de confirmación de acceso a historial (login exitoso).
- ☐ Notificación de cambio de contraseña realizado.
- ☐ Notificación de reclamo actualizado (estado de reclamo ingresado).
- ☐ Resumen de transacciones (historial semanal/mensual si cliente solicita).

**Métodos de Notificación:**
El sistema DEBE permitir elegir cómo recibir notificaciones:
- **En Sistema:** Notificación visual dentro de la aplicación (icono de campana, banner).
- **Email:** Notificación enviada a correo registrado del usuario.
- **SMS (Futuro):** Notificación vía mensaje de texto (implementación futura).

El usuario DEBE poder configurar para cada tipo de notificación:
1. **Activado/Desactivado:** Toggle para incluir o excluir la notificación.
2. **Canal:** Elegir si por "En Sistema", "Email", o ambos.
3. **Frecuencia:** Para notificaciones repetidas (ej., resumen diario: Activado/Desactivado).

**Almacenamiento de Preferencias:**
- Sistema DEBE almacenar preferencias de notificación por usuario.
- Cambios DEBEN guardarse inmediatamente al cambiar toggle.
- Sistema DEBE tener valores por defecto razonables para nuevos usuarios.

**Restricciones:**
- Notificaciones críticas de seguridad (acceso no autorizado, cambio de contraseña) NO pueden desactivarse (siempre activadas para protección).
- Operador NO puede cambiar notificaciones de otros operadores.
- Cliente NO puede cambiar notificaciones de otros clientes.
- Admin PUEDE ver pero NO puede cambiar notificaciones de otros usuarios (solo propias).

**Criterio de Aceptación:**
- Usuario activa/desactiva cada notificación sin errores.
- Cambios se guardan y persisten tras logout/login.
- Notificaciones se disparan solo si están activadas.
- Notificaciones críticas de seguridad no se pueden desactivar.
- Cada rol ve solo notificaciones relevantes a su función.

---

#### [RF-PERFIL-003] Cambio de Contraseña Seguro
El sistema SHALL permitir que cada usuario cambie su contraseña desde el módulo de Configuración de Perfil:

**Proceso de Cambio:**
1. Usuario ingresa contraseña actual (validación de identidad).
2. Usuario ingresa nueva contraseña (mínimo 8 caracteres, complejidad: mayúscula, minúscula, número, símbolo).
3. Usuario confirma nueva contraseña (campo de repetición).
4. Sistema valida que nueva contraseña no sea igual a anteriores 5 contraseñas (evita reutilización).
5. Sistema cierra todas las sesiones activas del usuario (fuerza re-login con nueva contraseña).
6. Sistema registra el cambio en auditoría (quién cambió, cuándo, resultado).

**Seguridad:**
- Campo de contraseña DEBE estar enmascarado (puntos/asteriscos).
- Mensaje de error NO debe revelar si contraseña actual es correcta o no (seguridad: "Datos no válidos").
- Sistema DEBE bloquear cambio si intenta 3 veces fallidas (30 minutos de bloqueo).

**Notificación:**
- Tras cambio exitoso, enviar email de confirmación al usuario (notificar de cambio de contraseña).
- Email DEBE tener opción de "Si no fuiste tú, reportar actividad sospechosa".

**Criterio de Aceptación:**
- Cambio de contraseña funciona correctamente.
- Contraseña anterior no funciona tras cambio.
- Validación de complejidad rechaza contraseñas débiles.
- Bloqueo tras intentos fallidos activa.
- Email de confirmación se envía.

---

#### [RF-PERFIL-004] Gestión de Sesiones Activas
El sistema SHALL permitir que usuario visualice y administre sus sesiones activas desde Configuración de Perfil:

**Información de Sesión:**
El usuario DEBE poder ver un listado de todas sus sesiones activas con:
- Dispositivo/navegador (ej., "Chrome en Tablet", "Firefox en PC").
- Dirección IP de acceso.
- Ubicación aproximada (si es posible geolocalización).
- Hora de inicio de sesión.
- Última actividad (timestamp).

**Acciones:**
- Usuario PUEDE cerrar sesión remota individual (botón "Cerrar Sesión").
- Usuario PUEDE cerrar todas las sesiones excepto la actual (botón "Cerrar Todas las Demás").
- Sistema DEBE notificar al usuario si sesión se cierra remotamente (para detectar acceso no autorizado).

**Restricciones:**
- Operador solo ve sus propias sesiones.
- Cliente solo ve propias sesiones.
- Admin PUEDE ver solo sus sesiones (en versión MVP; futuro: admin ver sesiones de otros).

**Criterio de Aceptación:**
- Listado de sesiones es preciso y actualizado.
- Cierre de sesión remota funciona (usuario se desconecta inmediatamente).
- Notificación se envía cuando sesión se cierra remotamente.

---

#### [RF-PERFIL-005] Preferencias de Formato e Idioma
El sistema SHALL permitir que usuario personalice formato de visualización:

**Opciones Disponibles:**

**Idioma (Futuro):**
- ☐ Español colombiano (por defecto, actual).
- ☐ Español latino (futuro).
- ☐ Inglés (futuro).

**Formato de Fecha:**
- ☐ DD de MMM de YYYY (por defecto: "5 de mayo de 2026").
- ☐ DD/MM/YYYY (alternativa: "05/05/2026").
- ☐ YYYY-MM-DD (ISO: "2026-05-05").

**Formato de Moneda:**
- ☐ $X.XXX,XX (por defecto colombiano: "$1.234,56").
- ☐ $X,XXX.XX (alternativa: "$1,234.56").
- ☐ X.XXX,XX COP (con código de moneda).

**Zona Horaria:**
- ☐ Zona horaria local de Colombia (por defecto: COT, UTC-5).
- ☐ Zona horaria seleccionable (si usuario viaja).

**Tema Visual (Futuro):**
- ☐ Tema claro (por defecto).
- ☐ Tema oscuro (futuro, reduce fatiga ocular).

**Criterio de Aceptación:**
- Cambio de formato se aplica inmediatamente en toda la aplicación.
- Formato persiste tras logout/login.
- Todos los reportes y transacciones usan formato elegido por usuario.

---

#### [RF-PERFIL-006] Datos y Privacidad
El sistema SHALL proporcionar información y herramientas de privacidad:

**Información de Datos:**
Usuario PUEDE visualizar:
- Qué datos personales posee el sistema (nombre, email, teléfono, historial de transacciones).
- Cuándo fue creada su cuenta.
- Cuándo fue último acceso.
- Número total de transacciones (si Cliente) o registros procesados (si Operador).

**Solicitud de Datos Personales (GDPR-Like):**
Usuario PUEDE solicitar:
- **Exportación de Datos Personales:** Descargar todos sus datos en formato JSON o CSV.
- **Solicitud de Eliminación (Futuro):** Solicitar eliminación de cuenta (con restricciones legales: datos deben archivarse 2 años).

**Control de Consentimiento:**
- ☐ Consentimiento para análisis de datos (futuro, para mejora de sistema).
- ☐ Consentimiento para marketing (futuro, envío de promociones).

**Criterio de Aceptación:**
- Usuario ve qué datos posee el sistema.
- Exportación genera archivo válido (JSON/CSV) con todos los datos.
- Solicitud de eliminación se registra en auditoría (futuro).

---

#### [RF-PERFIL-007] Interfaz de Configuración de Perfil
El módulo de Configuración de Perfil DEBE presentar una interfaz clara, intuitiva y responsiva:

**Layout de Pantalla:**
```
╔════════════════════════════════════════════════════════════════╗
║ ← VOLVER                        MI PERFIL DE USUARIO            ║
╚════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────┐
│ INFORMACIÓN PERSONAL                                           │
├──────────────────────────────────────────────────────────────┤
│ Nombre:              Juan Carlos Pérez López                 │
│ Email:               juan.perez@email.com                     │
│ Rol:                 OPERADOR                                 │
│ Cuenta creada:       5 de mayo de 2026                        │
│ Último acceso:       Hoy, 10:30 AM                            │
│                                                               │
│ [CAMBIAR CONTRASEÑA] [MIS SESIONES ACTIVAS]                 │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ NOTIFICACIONES PERSONALIZADAS                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ ☑ Cambio tarifario próximo                                  │
│   Canales: [☑ En Sistema] [☑ Email]                         │
│                                                               │
│ ☑ Parqueadero lleno (0 espacios)                            │
│   Canales: [☑ En Sistema] [☐ Email]                         │
│                                                               │
│ ☑ Error en procesamiento de pago                            │
│   Canales: [☑ En Sistema] [☑ Email]                         │
│   * Crítica de Seguridad - No se puede desactivar           │
│                                                               │
│ ☑ Impresora offline                                         │
│   Canales: [☑ En Sistema] [☐ Email]                         │
│                                                               │
│ [GUARDAR PREFERENCIAS]                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ FORMATO E IDIOMA                                              │
├──────────────────────────────────────────────────────────────┤
│ Formato de Fecha:    [DD de MMM de YYYY ▼]                  │
│ Formato de Moneda:   [$X.XXX,XX (COP) ▼]                   │
│ Zona Horaria:        [COT (UTC-5) ▼]                        │
│ Idioma:              [Español Colombiano ▼]                 │
│                                                               │
│ [GUARDAR PREFERENCIAS]                                      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ DATOS Y PRIVACIDAD                                            │
├──────────────────────────────────────────────────────────────┤
│ Datos en el sistema: 47 transacciones registradas            │
│                                                               │
│ [DESCARGAR MIS DATOS (JSON)] [SOLICITAR ELIMINACIÓN]        │
└──────────────────────────────────────────────────────────────┘

        [← CERRAR] [GUARDAR CAMBIOS]
```

**Requisitos de Diseño:**
- **Responsivo:** Funcionar en desktop, tablet, móvil sin perder funcionalidad.
- **Accesible:** WCAG AA (contraste 4.5:1 mínimo, navegable por teclado, Tab order lógico).
- **Guardar Automático:** Cambios en notificaciones se guardan al cambiar toggle (sin botón Guardar).
- **Validación Visual:** Cambios guardados muestran mensaje de confirmación (ej., "✓ Guardado").
- **Confirmación Crítica:** Cambios de contraseña piden confirmación adicional.

**Criterio de Aceptación:**
- Interfaz es responsiva en todos los tamaños de pantalla.
- Cambios se guardan correctamente.
- Mensajes de confirmación son claros.
- Accesibilidad cumple WCAG AA.
- Operador nuevo puede cambiar notificaciones sin ayuda.

---

## 3.2 Requerimientos No Funcionales (RNF)

Los siguientes requerimientos no funcionales definen atributos de calidad, rendimiento, seguridad, confiabilidad y usabilidad que el sistema DEBE cumplir durante operación.

---

### 3.2.1 Requerimientos No Funcionales de Rendimiento

#### [RNF-REND-001] Tiempo de Respuesta
El sistema SHALL responder a acciones del usuario dentro de los siguientes tiempos máximos:

| Acción | Tiempo Máximo | Justificación |
|--------|--------------|---------------|
| Login de usuario | 3 segundos | Operador requiere acceso inmediato. |
| Registro de entrada de vehículo | 5 segundos | Capacidad de procesar múltiples vehículos/hora. |
| Búsqueda de vehículo para salida | 2 segundos | Búsqueda debe ser inmediata (base local). |
| Cálculo de tarifa | 1 segundo | Cálculo aritmético simple. |
| Impresión de tiquete | 10 segundos | Impresora térmica requiere tiempo mecánico. |
| Generación de reporte (diario) | 15 segundos | Datos históricos de 1 día. |
| Generación de reporte (mensual) | 60 segundos | Datos históricos de 30 días. |

El sistema DEBE medir y registrar tiempos de respuesta reales en logs para auditoría de performance.

**Criterio de Aceptación:**
- Tiempos medidos reales están dentro de máximos especificados en condiciones normales.
- Bajo carga pico (200 transacciones/día), degradación máxima 20% (ej., 3 segundos → 3.6 segundos).

---

#### [RNF-REND-002] Throughput (Capacidad de Transacciones)
El sistema SHALL procesar sin degradación:

**Carga Normal:**
- 50 transacciones/día (entrada + salida).
- Promedio: 2 transacciones/hora en horario comercial.

**Carga Pico Soportada:**
- 200 transacciones/día.
- Picos: 10 transacciones/hora sin pérdida de datos.

**Escalabilidad:**
- Sistema DEBE diseñarse para escalar hasta 500 transacciones/día en futuro (arquitectura lo permite, aunque no se requiere hoy).

**Criterio de Aceptación:**
- Carga normal procesada sin error.
- Carga pico procesa sin pérdida de datos.
- Tiempos de respuesta degradan máximo 20% en pico.

---

#### [RNF-REND-003] Uso de Recursos
El sistema SHALL mantener uso eficiente de recursos:

**Memoria:**
- Aplicación en dispositivo (tablet) DEBE usar máximo 500 MB RAM en operación normal.
- Máximo 1 GB bajo carga pico.

**Almacenamiento:**
- Base de datos local DEBE ocupar máximo 100 MB por año de operación (estimado 50,000 transacciones/año).
- Sistema DEBE permitir backup/exportación de datos antiguos para liberar espacio.

**Ancho de Banda (cuando online):**
- Sincronización DEBE usar máximo 1 MB por 10,000 transacciones.
- Sistema DEBE comprimir datos si es necesario.

**Criterio de Aceptación:**
- Perfilamiento de memoria y almacenamiento cumple límites.
- Aplicación responde rápidamente incluso con BD de 1 año.

---

### 3.2.2 Requerimientos No Funcionales de Disponibilidad y Confiabilidad

#### [RNF-CONF-001] Disponibilidad del Sistema
El sistema SHALL mantener disponibilidad mínima:

**Operación Normal:**
- **99.5% uptime anual** = máximo 43 minutos de downtime por mes.
- Sistema debe ser **reiniciable en menos de 2 minutos** si falla.

**Mantenimiento Programado:**
- Admin PUEDE programar ventana de mantenimiento (máximo 1 hora por mes).
- Mantenimiento DEBE realizarse fuera de horarios pico (ej., 2 AM - 3 AM).

**Redundancia:**
- Sistema DEBE tener **backup automático diario** de base de datos.
- Backup DEBE guardarse en ubicación separada (ej., servidor remoto o USB externo).
- Recuperación de backup DEBE restaurar sistema a máximo 1 día anterior.

**Criterio de Aceptación:**
- Uptime medido alcanza 99.5% o superior anual.
- Reinicio automático funciona tras fallos.
- Backups se ejecutan diariamente sin fallos.

---

#### [RNF-CONF-002] Recuperación ante Fallos
El sistema SHALL implementar mecanismos de recuperación ante fallos:

**Tipos de Fallos y Respuesta:**

1. **Fallo de Conexión de Internet:**
   - Sistema entra en modo offline automáticamente.
   - Operaciones críticas continúan (entrada, salida, cálculo tarifario).
   - Al recuperar conexión, sincroniza automáticamente.

2. **Fallo de Impresora:**
   - Sistema detecta que impresora está offline.
   - Permite continuar operación (guarda tiquete en cola de impresión).
   - Notifica operador que tiquete se imprimirá cuando impresora esté disponible.

3. **Fallo de Gateway de Pago (pagos con tarjeta):**
   - Si falla, operador puede registrar pago en efectivo como alternativa.
   - Sistema reintenta conexión automáticamente cada 30 segundos.

4. **Corrupción de Base de Datos Local:**
   - Sistema detecta inconsistencias.
   - Restaura automáticamente desde backup más reciente.
   - Registra evento en log para investigación.

5. **Pérdida de Datos de Transacción en Proceso:**
   - Si transacción se interrumpe (ej., fallo de energía), sistema DEBE poder recuperarse.
   - Al reiniciar, DEBE mostrar estado anterior (transacción en proceso, opción de continuar o cancelar).

**Criterio de Aceptación:**
- Sistema responde a cada tipo de fallo sin pérdida de datos críticos.
- Recuperación automática funciona en laboratorio.
- Operador tiene opciones claras para continuar tras fallo.

---

#### [RNF-CONF-003] Integridad de Datos
El sistema SHALL proteger integridad de datos:

**Transacciones Atómicas:**
- Toda operación de entrada/salida DEBE ser atómica: se completa totalmente o no se ejecuta.
- Si falla a mitad (ej., se registra entrada pero no se imprime tiquete), sistema DEBE poder reversar cambios.

**Validación de Datos:**
- Todo dato ingresado por operador DEBE ser validado antes de almacenamiento.
- Datos inválidos DEBEN ser rechazados con error descriptivo.

**Checksums y Detección de Corrupción:**
- Base de datos local DEBE incluir checksums para detectar corrupción.
- Reportes DEBEN validar integridad (ej., suma total de ingresos = suma de transacciones individuales).

**Criterio de Aceptación:**
- Operaciones atómicas se comportan correctamente en pruebas.
- Validación de datos es exhaustiva.
- Detección de corrupción funciona (prueba con base dañada).

---

### 3.2.3 Requerimientos No Funcionales de Seguridad

#### [RNF-SEG-001] Autenticación y Autorización
El sistema SHALL implementar seguridad de acceso:

**Autenticación:**
- Todo usuario DEBE autenticarse con usuario/email + contraseña antes de acceder al sistema.
- Contraseña DEBE almacenarse cifrada (algoritmo bcrypt o PBKDF2 con salt aleatorio).
- Contraseña DEBE cumplir complejidad mínima:
  - Mínimo 8 caracteres.
  - Incluir mayúscula, minúscula, número, símbolo.

**Autorización (Rol-Based Access Control - RBAC):**
- Admin/Propietario: Acceso a TODAS las funciones.
- Operador: Acceso solo a recepción, salida, visualización de propias transacciones.
- Cliente (futuro): Acceso solo a consulta de propio tiquete/recibo.

**Bloqueo de Intentos Fallidos:**
- Después de 3 intentos de login fallidos, cuenta se bloquea por 30 minutos.
- Sistema notifica al admin de intentos fallidos repetidos (posible ataque).

**Criterio de Aceptación:**
- Solo usuarios autenticados acceden al sistema.
- Contraseña se almacena cifrada (no en texto plano).
- Roles limitan acceso correctamente.
- Bloqueo tras fallos funciona.

---

#### [RNF-SEG-002] Cifrado de Datos Sensibles
El sistema SHALL cifrar datos sensibles:

**Datos Sensibles:**
- Contraseña de usuario: Cifrada con hash (bcrypt).
- Placa vehicular: Cifrada en almacenamiento (AES-256).
- Datos de cliente: Cifrados en almacenamiento (AES-256).
- Datos de pago: Cifrados (NO se almacena número de tarjeta completo, solo últimos 4 dígitos).

**Transporte (HTTPS):**
- Toda comunicación con servidor remoto DEBE ser HTTPS (TLS 1.3 mínimo).
- Certificado SSL DEBE ser válido y de autoridad confiable.

**Criterio de Aceptación:**
- Datos sensibles están cifrados en resto.
- Comunicación usa HTTPS.
- Certificado SSL es válido.

---

#### [RNF-SEG-003] Auditoría y Logging
El sistema SHALL registrar auditoría completa:

**Eventos Auditados:**
- Login/Logout de usuarios (quién, cuándo, desde dónde).
- Cambios de tarifa (quién cambió, qué cambió, cuándo).
- Acceso a datos de cliente/placa (quién, cuándo, para qué transacción).
- Modificación de reclamos/disputas.
- Descuentos especiales otorgados (quién, cuándo, razón).
- Cambios en control de acceso (usuario nuevo, eliminación, cambio de rol).
- Errores del sistema (qué falló, cuándo, contexto).

**Logs:**
- Todos los eventos DEBEN registrarse en archivo de log con timestamp.
- Logs DEBEN incluir: quién (usuario), qué (acción), cuándo (timestamp), resultado.
- Logs DEBEN ser **inmutables** (no pueden editarse, solo archivarse).
- Admin PUEDE generar reporte de auditoría filtrando por usuario, fecha, acción.

**Retención:**
- Logs DEBEN archivarse por mínimo **2 años**.
- Archivos de log DEBEN comprimirse para ahorrar espacio.

**Criterio de Aceptación:**
- Todos los eventos críticos se registran.
- Logs contienen información completa (quién, qué, cuándo).
- Reportes de auditoría funcionan correctamente.
- Logs son inmutables (prueba intentando editar archivo de log).

---

#### [RNF-SEG-004] Control de Acceso a Información Sensible
El sistema SHALL restringir acceso a información sensible:

**Información Restringida:**

| Información | Admin | Operador | Cliente |
|-------------|-------|----------|---------|
| Todas las placas | ✓ | ✓ en turno | ✗ |
| Datos de clientes | ✓ | ✓ en turno | Solo propios |
| Ingresos totales | ✓ | ✗ | ✗ |
| Reportes | ✓ | ✓ limitado | ✗ |
| Tarifas | ✓ Editar | ✓ Ver | ✓ Ver |
| Usuarios/Roles | ✓ | ✗ | ✗ |
| Logs de auditoría | ✓ | ✗ | ✗ |

**Implementación:**
- Sistema DEBE verificar rol del usuario en CADA solicitud.
- DEBE rechazar accesos no autorizados con error HTTP 403 (Forbidden).
- DEBE registrar intentos de acceso no autorizado en auditoría.

**Criterio de Aceptación:**
- Operador NO puede ver ingresos de otros operadores.
- Operador NO puede modificar tarifas.
- Cliente NO puede ver placas de otros vehículos.
- Intentos de bypass se registran en auditoría.

---

### 3.2.4 Requerimientos No Funcionales de Usabilidad

#### [RNF-USA-001] Interfaz de Usuario Intuitiva
El sistema SHALL proporcionar interfaz clara y fácil de usar:

**Principios de Diseño:**
- **Estructura clara:** Menú principal con opciones bien organizadas (Entrada, Salida, Reportes, Configuración).
- **Mínimo número de clics:** Operador DEBE acceder a función principal en máximo 3 clics desde login.
- **Campos relevantes:** Formularios muestran solo campos necesarios (sin complejidad innecesaria).
- **Validación visible:** Errores se muestran en rojo con mensaje claro (no código de error técnico).
- **Confirmación de acciones críticas:** Antes de eliminar, modificar tarifa, etc., sistema pide confirmación.

**Contraste y Legibilidad:**
- Fuente mínimo 12 puntos en pantalla.
- Contraste texto/fondo cumple estándar WCAG AA (ratio 4.5:1 mínimo).
- Colores NO se usan como único medio de comunicación (también usar iconos, texto).

**Criterio de Aceptación:**
- Operador nuevo puede completar entrada en menos de 1 minuto sin capacitación.
- Errores son claros y no técnicos.
- Interfaz es accesible a usuarios con visión reducida (contraste alto).

---

#### [RNF-USA-002] Tiquetes e Información Legible
El sistema SHALL generar tiquetes y recibos profesionales:

**Formato de Tiquete:**
- Ancho: 58 mm (estándar de impresora térmica).
- Altura: A6 (105 × 148 mm) si se prefiere.
- Fuente: Sans-serif, mínimo 8 puntos para texto normal, 10 puntos para información crítica (placa, tarifa).
- Márgenes: Mínimo 5 mm en todos los lados.
- Espaciado: Líneas con suficiente separación (no apretado).

**Contenido Obligatorio:**
- Encabezado con nombre del parqueadero + logo (si existe).
- Datos de operación (placa, hora, categoría, operador).
- Tarifa clara con desglose.
- Términos de custodia legibles.
- Información de contacto.

**Ejemplo de Tiquete:**
```
═════════════════════════════════════
        PARQUEADERO PÚBLICO NEIVA
═════════════════════════════════════

COMPROBANTE DE ENTRADA
─────────────────────────────────────
Fecha:           5 MAY 2026, 10:15 AM
Placa:           AAA-123
Categoría:       LIVIANO (A)
Espacio:         B-15

Operador:        CARLOS RUIZ
Transacción ID:  TXN-20260505-00042

─────────────────────────────────────
⚠️  AVISO DE CUSTODIA:
El parqueadero ES RESPONSABLE por
daño, robo, hurto o pérdida del
vehículo, accesorios o contenido.
Reclamos en 24h al +57 320-xxx-xxxx
───────────────────────────────────────

Contacto: +57 320-xxx-xxxx
          parqueadero@email.com

═════════════════════════════════════
```

**Criterio de Aceptación:**
- Tiquete imprime legiblemente en impresora térmica.
- Términos de custodia son claros y leíbles.
- Información crítica (placa, tarifa) es destacada.

---

#### [RNF-USA-003] Ayuda y Documentación
El sistema SHALL proporcionar ayuda al usuario:

**Dentro del Sistema:**
- Menú "Ayuda" accesible en página principal.
- Tooltips (pequeñas ventanas de ayuda) al pasar mouse sobre campos complejos.
- FAQ (Preguntas Frecuentes) con respuestas comunes.
- Contacto de soporte (teléfono, email, chat si es posible).

**Documentación Externa:**
- **Manual de Usuario:** Documento PDF con instrucciones paso-a-paso para Operador.
- **Manual de Admin:** Documento PDF con instrucciones de configuración, reportería, auditoría.
- **Guía Rápida:** Cartel impreso en la estación de trabajo (lamina plastificada) con pasos críticos.

**Capacitación:**
- Propietario proporciona sesión de capacitación inicial a operadores (mínimo 2 horas).
- Sistema DEBE tener demo/tutorial interactivo para nuevos usuarios.

**Criterio de Aceptación:**
- Ayuda en sistema es accesible y útil.
- Manual de usuario es comprensible.
- Operador nuevo puede completar flujo básico usando solo ayuda en sistema.

---

#### [RNF-USA-004] Idioma y Localización
El sistema SHALL estar disponible en español colombiano:

**Idioma:**
- Toda interfaz, mensajes de error, documentación en español.
- Evitar tecnicismos innecesarios (usar palabras comunes).
- Números, fechas, moneda en formato colombiano:
  - Fecha: DD de MMM de YYYY (ej., "5 de mayo de 2026").
  - Moneda: COP con símbolo $ (ej., "$25,000").
  - Números: Usar punto decimal y coma para miles (ej., "1.234,56").

**Localización Futura:**
- Sistema DEBE estar diseñado para permitir multi-idioma en futuro (sin reconstruir código).
- Textos DEBEN estar en archivo de recursos separado (no hardcodeados).

**Criterio de Aceptación:**
- Interfaz completamente en español colombiano.
- Formato de fecha, moneda, números es correcto.
- Sin palabras técnicas innecesarias.

---

### 3.2.5 Requerimientos No Funcionales de Mantenibilidad

#### [RNF-MANT-001] Código Limpio y Documentación
El sistema DEBE desarrollarse con calidad de código:

**Estándares de Código:**
- Lenguaje de programación: A decidir (ej., TypeScript, Python, C#).
- Framework: A decidir según lenguaje (ej., React, Django, .NET).
- Linting: Usar ESLint (JavaScript) o equivalente en lenguaje.
- Estilo: Seguir guía de estilo consensuada (ej., Google, Airbnb).

**Documentación:**
- Clases y funciones públicas DEBEN tener comentarios explicativos.
- Lógica compleja DEBE documentarse con ejemplos de uso.
- Archivo README.md del proyecto DEBE incluir:
  - Descripción del proyecto.
  - Instrucciones de instalación.
  - Instrucciones de ejecución.
  - Instrucciones de testing.
  - Instrucciones de deployment.

**Criterio de Aceptación:**
- Código pasa validación de linter sin errores (warnings permitidos si son justificados).
- Funciones públicas tienen comentarios JSDoc o equivalente.
- README es completo y actualizado.

---

#### [RNF-MANT-002] Testing y Cobertura
El sistema SHALL incluir pruebas automatizadas:

**Tipos de Pruebas:**
- **Unit Tests:** Pruebas de funciones individuales (cálculo tarifario, validación de placa, etc.).
  - Cobertura mínima: 80% de código crítico (lógica de tarifas, seguridad).
  - Framework: Jest, Mocha, pytest, según lenguaje.
  
- **Integration Tests:** Pruebas de flujos completos (entrada → salida → pago).
  - Casos: Entrada normal, entrada con error, salida con descuento, pago fallido, etc.
  - Base de datos de prueba: SQLite local.

- **E2E Tests (Futuro):** Pruebas de interfaz de usuario con usuario real interactuando.
  - Framework: Cypress, Selenium, Playwright.
  - Casos: Operador completa entrada → salida en secuencia.

**Cobertura Mínima:**
- Funciones críticas: 80% cobertura.
- Funciones estándar: 60% cobertura.
- Interfaz: 40% cobertura (E2E).

**Criterio de Aceptación:**
- Suite de tests se ejecuta sin fallos.
- Cobertura medida alcanza mínimos especificados.
- Cada requisito funcional tiene al menos 1 test.

---

#### [RNF-MANT-003] Versionamiento y Control de Cambios
El sistema DEBE gestionar versiones:

**Versionamiento:**
- Usar Semantic Versioning: MAJOR.MINOR.PATCH (ej., 1.2.5).
- MAJOR: Cambios incompatibles (ej., migración de BD).
- MINOR: Nuevas funcionalidades compatibles (ej., nuevo reporte).
- PATCH: Correcciones de bugs (ej., fix de cálculo tarifario).

**Control de Versiones (Git):**
- Repositorio Git con ramas:
  - `main`: Código en producción (stable).
  - `develop`: Código de desarrollo (prérelease).
  - `feature/xxx`: Ramas por característica.
  - `hotfix/xxx`: Ramas por corrección urgente.

**Changelog:**
- Archivo CHANGELOG.md documentando cambios por versión.
- Formato: Fecha, versión, lista de cambios (nuevas funciones, fixes, deprecaciones).

**Criterio de Aceptación:**
- Versiones siguen Semantic Versioning.
- Repositorio Git tiene estructura limpia de ramas.
- Changelog es actualizado con cada versión.

---

#### [RNF-MANT-004] Escalabilidad y Extensibilidad
El sistema DEBE diseñarse para evolucionar:

**Arquitectura Modular:**
- Funcionalidades separadas en módulos independientes:
  - Módulo de autenticación.
  - Módulo de transacciones.
  - Módulo de reportería.
  - Módulo de pago.
- Dependencias claras y acoplamiento mínimo entre módulos.

**APIs Internas:**
- Interfaces bien definidas entre módulos.
- Fácil agregar nuevas funcionalidades sin modificar código existente.

**Extensiones Futuras:**
- OCR/Cámara: Implementable como plugin sin afectar core.
- Multi-parqueadero: BD diseñada para soportar múltiples locaciones.
- Integración con sistemas externos: API REST clara para terceros.

**Criterio de Aceptación:**
- Arquitectura modular se valida en revisión de código.
- Agregar nuevo reporte requiere mínimo 20 líneas de código.
- API REST está documentada (si existe).

---

### 3.2.6 Requerimientos No Funcionales Operacionales

#### [RNF-OPER-001] Compatibilidad con Dispositivos
El sistema SHALL funcionar en:

**Hardware Soportado:**
- **Tablet:** iPad o tablet Android de 7"-10" con OS actual (iOS 14+ o Android 10+).
- **PC de escritorio:** Windows 10/11 o Linux (Ubuntu 20.04+) con navegador moderno.
- **Impresora:** Impresora térmica 58 mm compatible con driver estándar (ej., Epson, Star Micronics).
- **Lector de código de barras (futuro):** Dispositivo USB genérico.
- **Cámara (futuro):** Cámara integrada en tablet o USB.

**Navegadores Soportados:**
- Chrome 90+.
- Safari 14+ (si web).
- Firefox 88+.
- Edge 90+.

**Criterio de Aceptación:**
- Aplicación instala sin error en tablet/PC.
- Interfaz es responsive (se adapta a 7" tablet y 24" monitor).
- Impresión funciona sin drivers adicionales.

---

#### [RNF-OPER-002] Instalación y Configuración
El sistema DEBE instalarse fácilmente:

**Instalación:**
- Descarga automática desde app store (iOS/Android) o instalador único (Windows/Linux).
- Proceso guiado de configuración inicial (setup wizard).
- Duración total: máximo 10 minutos para usuario no técnico.

**Configuración Inicial (Setup Wizard):**
1. Seleccionar idioma (español).
2. Crear usuario Admin (email, contraseña).
3. Nombre del parqueadero.
4. Configurar tarifas base (A, B, C, D).
5. Configurar dispositivos (impresora, cámara si existe).
6. Revisar y activar.

**Actualización:**
- Actualizaciones DEBEN descargarse automáticamente en background.
- Instalación DEBE ocurrir sin interrumpir operación (en horarios no pico si es posible).
- Si actualización crítica requiere downtime, notificar al Admin 24h antes.

**Criterio de Aceptación:**
- Setup completa en menos de 10 minutos.
- Actualizaciones instalan sin error.

---

#### [RNF-OPER-003] Backup y Recuperación
El sistema DEBE proteger datos:

**Backup Automático:**
- Ejecutar diariamente a las 2 AM (horario configurable).
- Incluir base de datos completa + archivos de configuración.
- Guardar en:
  - Servidor remoto (si conectado a internet).
  - Almacenamiento local USB (como respaldo).

**Backup Manual:**
- Admin PUEDE solicitar backup en cualquier momento.
- Sistema genera archivo de backup descargable.

**Recuperación:**
- Admin PUEDE restaurar desde cualquier backup anterior.
- Proceso de restauración DEBE validar integridad del backup.
- Tiempo de restauración: máximo 5 minutos.

**Retención:**
- Mantener backups de últimos 30 días.
- Eliminar automáticamente backups más antiguos (ahorro de espacio).
- Admin PUEDE marcar backup como "no eliminar" si requiere conservar.

**Criterio de Aceptación:**
- Backup diario se ejecuta sin fallos.
- Restauración desde backup recupera datos correctamente.
- Validación de integridad detecta backups corruptos.

---

#### [RNF-OPER-004] Soporte y Actualización
El propietario DEBE recibir soporte:

**Ciclo de Vida:**
- **MVP (Fase 1):** Desarrollo + soporte intenso por 3 meses.
- **Estable (Fase 2+):** Soporte y mejoras continuas según necesidad.

**Soporte Incluido:**
- Bug fixes: Correcciones de errores dentro de 24 horas de reporte.
- Helpdesk: Soporte técnico por teléfono/email (horario comercial).
- Capacitación: Sesiones de capacitación para nuevos operadores.
- Actualizaciones: Mejoras y nuevas funcionalidades según roadmap.

**Términos de Soporte:**
- Respuesta a incidente crítico (sistema caído): 1 hora.
- Respuesta a incidente de severidad media (funcionalidad limitada): 4 horas.
- Respuesta a incidente de severidad baja (mejora solicitada): 48 horas.

**Criterio de Aceptación:**
- SLA de respuesta se cumple en 95%+ de casos.
- Bugs reportados se documentan en issue tracker.

---

## 3.3 Matriz de Trazabilidad de Requisitos

La siguiente matriz vincula cada **necesidad operativa del Caso de Estudio** con los **requisitos funcionales y no funcionales** que la solucionan:

| ID | Necesidad Operativa | RF Asociado | RNF Asociado |
|----|--------------------|-------------|--------------|
| 1 | Cumplimiento legal (Ley 1801/2016, Ley 1480/2011) | RF-LEGAL-001, RF-LEGAL-002 | RNF-SEG-003, RNF-SEG-004 |
| 2 | Crear Checklist Legal de pre-apertura | RF-LEGAL-002 | RNF-MANT-001, RNF-USA-001 |
| 3 | Protocolo Operativo: Recepción (placa, hora, inventario, recibo) | RF-RECEP-001, RF-RECEP-004, RF-RECEP-005, RF-SALIDA-005 | RNF-USA-002, RNF-CONF-003 |
| 4 | Aclaración legal: SOAT/Técnico-Mecánica | RF-LEGAL-001 | RNF-USA-001 |
| 5 | Lógica tarifaria (Categorías A, B, C, D) + actualización + modalidades | RF-TARIFA-001, RF-TARIFA-002, RF-TARIFA-003, RF-TARIFA-004 | RNF-REND-001, RNF-CONF-001 |
| 6 | Tratamiento de datos personales (Protección de placas) | RF-LEGAL-003 | RNF-SEG-002, RNF-SEG-003, RNF-SEG-004 |
| 7 | Consulta digital segura de historial para cliente | RF-CLIENTE-001 | RNF-SEG-001, RNF-SEG-004, RNF-USA-001, RNF-USA-004 |
| 8 | Configuración personalizada por usuario sin afectar otros | RF-PERFIL-001, RF-PERFIL-002, RF-PERFIL-003 | RNF-SEG-001, RNF-SEG-003, RNF-USA-001, RNF-USA-004 |

---

## 3.4 Criterios de Aceptación Generales

El sistema SRS será **aceptado** cuando cumpla con:

1. **Todos los Requisitos Funcionales (RF):** Cada RF debe estar implementado, funcional y testeable.
2. **Todos los Requisitos No Funcionales (RNF):** Cada RNF debe ser medible y validado en ambiente de prueba.
3. **Documentación Completa:** Manual de usuario, API (si existe), guía de administración.
4. **Testing:**
   - 100% de RF ejecutados en test cases.
   - Cobertura mínima 80% en código crítico (cálculo tarifario, seguridad).
5. **Cumplimiento Legal:**
   - Checklist legal completado y certificado.
   - Tiquetes incluyen términos de custodia.
   - Protección de datos implementada.
6. **Performance:**
   - Tiempos de respuesta dentro de especificación.
   - Throughput soporta carga pico.
7. **Seguridad:**
   - Autenticación y autorización funcional.
   - Datos sensibles cifrados.
   - Auditoría completa registrada.
8. **Operación Offline:**
   - Sistema funciona sin internet.
   - Sincronización automática sin conflictos.

---

# IV. APÉNDICES

## A. Glosario Extendido

*(Ver sección 1.3 Definiciones, Acrónimos y Abreviaturas para lista principal.)*

---

## B. Referencias Normativas

1. **IEEE Std 830-1998:** *Recommended Practice for Software Requirements Specifications.*
2. **Ley 1801/2016:** Código Nacional de Policía y Convivencia de Colombia.
3. **Ley 1480/2011:** Estatuto del Consumidor Colombiano.
4. **Ley de Protección de Datos Personales:** Normativa sobre tratamiento de información personal (Colombia).

---

## C. Cambios y Control de Versiones

| Versión | Fecha | Autor | Descripción de Cambio |
|---------|-------|-------|----------------------|
| 1.0 | 5 de mayo de 2026 | Analista de Sistemas Senior | Documento inicial completo según IEEE 830-1998. |

---

## D. Próximos Pasos y Roadmap Futuro

### Fase 1: MVP (Versión 1.0)
- Entrada y salida de vehículos.
- Cálculo tarifario básico (hora + fracción).
- Modalidades: tarifa por hora, tarifa por fracción, mensualidad, abono.
- Tiquetes y recibos.
- Reportería básica.
- Operación offline.
- Compliance legal mínimo.

**Duración estimada:** 8-12 semanas.  
**Inicio:** Tras aprobación de este SRS.  
**Metodología:** Scrum con sprints de 2 semanas.

### Fase 2: Extensiones (Versión 1.5+)
- OCR/Captura automática de placa.
- API REST para integración externa.
- Acceso cliente en línea (consulta de tiquete).
- Reportería avanzada (machine learning de patrones de ocupación).

**Duración estimada:** 4-6 semanas post-MVP.

### Fase 3: Escalabilidad (Versión 2.0+)
- Soporte para múltiples parqueaderos en un sistema.
- Integración con sistemas de terceros (pago online, etc.).
- App móvil para cliente.
- Dashboard de análisis predictivo.

**Duración estimada:** 8-12 semanas.

---

## E. Contacto y Soporte

**Para preguntas sobre este SRS:**
- Autor: Analista de Sistemas Senior
- Referencia: IEEE Std 830-1998
- Fecha de emisión: 5 de mayo de 2026

---

## APROBACIÓN DEL DOCUMENTO

Este Documento de Especificación de Requisitos ha sido elaborado conforme al estándar IEEE Std 830-1998.

**Requiere aprobación de:**

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Propietario/Stakeholder | _________________ | _________________ | __________ |
| Analista de Sistemas | _________________ | _________________ | __________ |
| Responsable de QA/Testing | _________________ | _________________ | __________ |
| Responsable Legal/Compliance | _________________ | _________________ | __________ |

---

**FIN DEL DOCUMENTO**

---

*Documento generado según Estándar IEEE Std 830-1998 para Especificación de Requisitos de Software.*  
*Traducción de Caso de Estudio: "Sistema de Gestión de Parqueaderos Públicos - Neiva, Colombia"*  
*Versión: 1.0 | Fecha: 5 de mayo de 2026*
