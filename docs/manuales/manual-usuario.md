# Manual de usuario

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.
Version 1.1 - octubre de 2026.

## 1. Que es

Una aplicacion web para operar un parqueadero publico: registrar la entrada y
salida de vehiculos, calcular y cobrar la tarifa, emitir tiquetes y recibos,
consultar reportes y cumplir con los requisitos legales.

Se abre en el navegador con la direccion del parqueadero (por ejemplo
`https://localhost:3001`) y funciona en computador, tablet y movil.

## 2. Roles

| Rol | Que puede hacer |
|-----|-----------------|
| Administrador | Todo: tarifas, reportes, reclamos, legal, espacios, usuarios y tambien entradas/salidas |
| Operador | Registrar entradas, salidas y pagos; ver vehiculos activos |
| Cliente | Consultar su propio historial de parqueo en el portal de clientes |

Las claves de administrador y operador se generan aleatoriamente cuando se
prepara la base de datos y se muestran una sola vez; el primer ingreso pide
cambiarlas. Los usuarios cliente los crea un administrador.

## 3. Como entrar

1. Abra la direccion del sistema.
2. Escriba su usuario y contrasena.
3. Pulse **Ingresar**. El sistema lo lleva automaticamente a su panel segun el
   rol.

Si se equivoca 3 veces, la cuenta se bloquea 30 minutos por seguridad.

## 4. Operador: registrar una entrada

1. En el menu lateral elija **Entrada**.
2. Complete:
   - **Placa**: formato colombiano `AAA-123` o `ABC123`.
   - **Categoria**: Liviano (A), Medio (B), Pesado (C) o Motocicleta (D).
   - **Placa internacional** (si aplica): active la casilla e indique pais y
     descripcion del vehiculo.
   - **Nombre completo** del conductor/propietario.
   - **Telefono** y **correo electronico** (opcionales). El correo permite que el
     cliente consulte su historial en linea.
3. Pulse **Registrar entrada**.
4. Aparece el **Ticket de entrada** con el numero de transaccion y el espacio
   asignado. Entreguelo al cliente y pulse **Aceptar**.

Si la placa ya esta dentro del parqueadero, el sistema avisa que tiene una
entrada activa.

## 5. Operador: registrar una salida y cobrar

1. Elija **Salida** en el menu.
2. Escriba la placa o el ID de transaccion y pulse **Buscar**.
3. Revise los datos del vehiculo: placa, categoria, hora de entrada, duracion y
   **total a pagar**.
4. Elija el metodo de pago:
   - **Efectivo**: escriba el monto recibido; el sistema calcula el cambio.
   - **Tarjeta, transferencia o billetera digital**: el sistema registra el pago.
   - **Abono**: si el cliente tiene saldo prepagado, se descuenta (puede ser pago
     mixto).
5. Pulse **Pagar**.
6. Aparece el **Recibo de salida** con el detalle. Entreguelo al cliente.

El espacio queda libre automaticamente y el vehiculo desaparece de **Activos**.

### Vehiculos activos

En **Activos** puede ver todos los vehiculos que estan dentro, buscar por placa y
consultar su hora de entrada, duracion y espacio.

### Notas sobre la tarifa

- Los primeros 15 minutos no tienen costo.
- A partir de ahi se cobra por hora completa (se redondea hacia arriba).
- Las tarifas por categoria las define el administrador.

## 6. Administrador

### Dashboard

Resumen del dia: ocupacion, ingresos, vehiculos activos y espacios libres.

### Tarifas

- **Por Hora**: precios por categoria dentro de una estructura tarifaria.
- **Fracciones**: precios para 15, 30 y 45 minutos.
- **Mensualidades**: suscripciones por placa (el cliente no paga por salida).
- **Abonos**: creditos prepagados por placa (se descuentan al salir).

### Reportes

Ocupacion, ingresos, transacciones (con filtros y exportacion), actividad de
usuarios y cumplimiento legal. Se pueden filtrar por fecha.

### Reclamos

Registro y seguimiento de reclamos por dano, cobro incorrecto, robo/hurto o
perdida: agregue notas, cambie el estado y registre la resolucion.

### Legal

- **Terminos de custodia**: versiones del aviso legal que se incluye en los
  tiquetes.
- **Checklists**: lista de verificacion legal de pre-operacion.

### Espacios

Matriz con el estado de cada espacio (ocupado/libre) y resumen de ocupacion.

### Usuarios

Listado de usuarios y creacion de nuevos (Administrador, Operador o Cliente).
Para un cliente, el correo es importante: con el consultara su historial.

## 7. Cliente: portal de consulta

Entre a la direccion del sistema y abra el **Portal de Clientes** (o use el login
principal; el sistema lo redirige). Hay dos formas de acceder:

1. **Con su cuenta**: correo electronico y contrasena (creados por el
   administrador).
2. **Con una transaccion**: codigo de transaccion (por ejemplo
   `TXN-20260927-00001`) y los ultimos 4 caracteres alfanumericos de la placa
   (para `ABC-123` son `C123`).

En el historial puede filtrar por fecha, ver el detalle de cada parqueo (horario,
duracion, total, metodo de pago) y descargar el recibo.

## 8. Preguntas frecuentes

**Olvide mi contrasena.** Solicite al administrador que restablezca su acceso.

**El sistema dice que la placa ya esta registrada.** El vehiculo ya tiene una
entrada activa; revise **Activos** o registre primero su salida.

**El total no coincide con lo esperado.** Revise la categoria y la duracion; los
primeros 15 minutos son gratis y luego se redondea a la hora completa. Las
tarifas vigentes las administra el administrador.

**Un cliente no ve su historial.** Verifique que la entrada se haya registrado
con el correo del cliente y que su usuario tenga rol Cliente.

**No puedo imprimir el tiquete.** Use la opcion de impresion del navegador; el
sistema tambien muestra el tiquete y el recibo en pantalla.

## 9. Recomendaciones de seguridad

- No comparta su usuario ni su contrasena.
- Cierre sesion al terminar el turno.
- Use contrasenas con mayuscula, minuscula, numero y simbolo (minimo 8
  caracteres).
