import { PrismaClient } from "@prisma/client";

export async function seedLegal(prisma: PrismaClient) {
  await prisma.custodyTerms.upsert({
    where: { version: "1.0" },
    update: {},
    create: {
      version: "1.0",
      is_active: true,
      content: `TERMINOS Y CONDICIONES DE CUSTODIA DE VEHICULOS

1. ACEPTACION DE LOS TERMINOS
Al ingresar su vehiculo a este parqueadero, usted acepta los presentes terminos y condiciones de custodia. Si no esta de acuerdo, debe retirar su vehiculo inmediatamente.

2. OBLIGACIONES DEL PARQUEADERO
El parqueadero se compromete a ejercer la custodia y vigilancia del vehiculo durante su permanencia en las instalaciones, de conformidad con lo establecido en la legislacion colombiana vigente. El parqueadero respondera por los danos y perjuicios causados al vehiculo que sean consecuencia directa de la culpa leve del personal del establecimiento, en los terminos del articulo 63 del Codigo Civil.

3. EXCLUSION DE RESPONSABILIDAD
El parqueadero no se hace responsable por:
a) Objetos de valor dejados al interior del vehiculo.
b) Danos causados por terceros ajenos al establecimiento.
c) Danos derivados de caso fortuito o fuerza mayor, tales como fenomenos naturales, actos delictivos de terceros, vandalismo, entre otros.

4. OBLIGACIONES DEL USUARIO
El usuario se obliga a:
a) Entregar el vehiculo en condiciones de seguridad.
b) Declarar cualquier condicion especial del vehiculo.
c) Retirar los objetos de valor del interior del vehiculo.
d) Presentar el tiquete de ingreso para retirar el vehiculo.

5. PERDIDA DEL TIQUETE
En caso de perdida del tiquete de custodia, el usuario debera acreditar la propiedad del vehiculo mediante la presentacion de los documentos legales correspondientes (tarjeta de propiedad, documento de identidad y denuncia por perdida del tiquete).

6. TARIFAS
Las tarifas aplicables son las vigentes al momento del ingreso del vehiculo y se encuentran publicadas en un lugar visible del establecimiento. Las tarifas pueden ser modificadas sin previo aviso.

7. ABANDONO DEL VEHICULO
Si un vehiculo permanece en el parqueadero por mas de treinta (30) dias calendario sin ser reclamado, el parqueadero podra iniciar el proceso de abandono de conformidad con la normatividad colombiana aplicable.

8. HORARIOS
El parqueadero presta sus servicios las 24 horas del dia, los 7 dias de la semana, salvo que se indique lo contrario en la entrada del establecimiento.

9. LEGISLACION APLICABLE
Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier controversia derivada de la aplicacion de estos terminos sera sometida a la jurisdiccion de los jueces de la ciudad de Neiva, Huila.

10. MODIFICACIONES
El parqueadero se reserva el derecho de modificar estos terminos en cualquier momento. Las modificaciones entraran en vigencia desde su publicacion en un lugar visible del establecimiento.

Version 1.0 - Vigente desde la fecha de publicacion.`,
    },
  });
}
