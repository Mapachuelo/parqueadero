import PDFDocument from "pdfkit";

export interface TicketData {
  transactionId: string;
  plate: string;
  category: string;
  entryTime: string;
  operatorName: string;
  custodyTerms: string;
  contactPhone: string;
  contactEmail: string;
  spaceAssigned?: string;
}

export function generateTicketPdf(data: TicketData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: [226.77, 500], margin: 15 });

  doc.font("Helvetica-Bold").fontSize(10).text("PARQUEADERO PUBLICO NEIVA", {
    align: "center",
    width: 196,
  });

  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("COMPROBANTE DE ENTRADA", { align: "center", width: 196 });

  doc.moveDown(0.5);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  const lineHeight = 14;
  doc.font("Helvetica").fontSize(8);
  doc.text(`Fecha: ${data.entryTime}`, 15, doc.y);
  doc.text(`Placa: ${data.plate}`, 15, doc.y + lineHeight);
  doc.text(`Categoria: ${data.category}`, 15, doc.y + lineHeight * 2);

  if (data.spaceAssigned) {
    doc.text(`Espacio: ${data.spaceAssigned}`, 15, doc.y + lineHeight * 3);
  }

  const opY = data.spaceAssigned ? lineHeight * 4 : lineHeight * 3;
  doc.text(`Operador: ${data.operatorName}`, 15, doc.y + opY);
  doc.text(
    `Transaccion ID: ${data.transactionId}`,
    15,
    doc.y + opY + lineHeight
  );

  doc.moveDown(2);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .text("AVISO DE CUSTODIA:", 15, doc.y);
  doc
    .font("Helvetica")
    .fontSize(7)
    .text(data.custodyTerms, 15, doc.y + 10, {
      width: 196,
      lineGap: 1,
    });

  doc.moveDown(1);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(7)
    .text(`Contacto: ${data.contactPhone}`, { align: "center" });
  doc.text(data.contactEmail, { align: "center" });

  doc.end();
  return doc;
}

export interface ReceiptData {
  transactionId: string;
  plate: string;
  category: string;
  entryTime: string;
  exitTime: string;
  durationMinutes: number;
  roundedHours: number;
  ratePerHour: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  changeAmount?: number;
  operatorName: string;
  contactPhone: string;
  contactEmail: string;
}

export function generateReceiptPdf(data: ReceiptData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: [226.77, 500], margin: 15 });

  doc.font("Helvetica-Bold").fontSize(10).text("PARQUEADERO PUBLICO NEIVA", {
    align: "center",
    width: 196,
  });

  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("RECIBO DE SALIDA", { align: "center", width: 196 });

  doc.moveDown(0.5);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  const lh = 14;
  doc.font("Helvetica").fontSize(8);
  doc.text(`Placa: ${data.plate}`, 15, doc.y);
  doc.text(`Categoria: ${data.category}`, 15, doc.y + lh);
  doc.text(`Transaccion: ${data.transactionId}`, 15, doc.y + lh * 2);
  doc.text(`Entrada: ${data.entryTime}`, 15, doc.y + lh * 3);
  doc.text(`Salida: ${data.exitTime}`, 15, doc.y + lh * 4);

  const hours = Math.floor(data.durationMinutes / 60);
  const mins = data.durationMinutes % 60;
  doc.text(
    `Duracion: ${hours}h ${mins}m (${data.roundedHours}h cobradas)`,
    15,
    doc.y + lh * 5
  );

  doc.moveDown(1);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc.text(`Tarifa por hora: $${data.ratePerHour.toLocaleString("es-CO")}`, 15, doc.y);
  doc.text(
    `Total: ${data.roundedHours}h x $${data.ratePerHour.toLocaleString("es-CO")}`,
    15,
    doc.y + lh
  );

  if (data.discountAmount > 0) {
    doc.text(
      `Descuento: -$${data.discountAmount.toLocaleString("es-CO")}`,
      15,
      doc.y + lh * 2
    );
  }

  const totalY = data.discountAmount > 0 ? lh * 3 : lh * 2;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `TOTAL A PAGAR: $${data.totalAmount.toLocaleString("es-CO")}`,
      15,
      doc.y + totalY
    );

  doc.moveDown(1);
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`Metodo de pago: ${data.paymentMethod}`, 15, doc.y);

  if (data.changeAmount !== undefined && data.changeAmount > 0) {
    doc.text(
      `Cambio: $${data.changeAmount.toLocaleString("es-CO")}`,
      15,
      doc.y + lh
    );
  }

  doc.text(`Operador: ${data.operatorName}`, 15, doc.y + lh);

  doc.moveDown(1);
  doc
    .moveTo(15, doc.y)
    .lineTo(211, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc
    .font("Helvetica")
    .fontSize(7)
    .text(`Contacto: ${data.contactPhone}`, { align: "center" });
  doc.text(data.contactEmail, { align: "center" });

  doc.end();
  return doc;
}

export function generateReportPdf(
  title: string,
  headers: string[],
  rows: string[][],
  orientation?: "portrait" | "landscape"
): PDFKit.PDFDocument {
  const isLandscape = orientation === "landscape";
  const doc = new PDFDocument({
    size: isLandscape ? "A4" : "A4",
    layout: isLandscape ? "landscape" : "portrait",
    margin: 40,
  });

  doc.font("Helvetica-Bold").fontSize(14).text(title, { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(9)
    .text(`Generado: ${new Date().toLocaleString("es-CO")}`, {
      align: "center",
    });
  doc.moveDown(1);

  const tableTop = doc.y;
  const colWidths: number[] = [];
  const pageWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colCount = headers.length;
  const baseWidth = pageWidth / colCount;

  headers.forEach((h, i) => {
    colWidths[i] = baseWidth;
  });

  doc.font("Helvetica-Bold").fontSize(8);
  let xPos = doc.page.margins.left;
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, tableTop, {
      width: colWidths[i] - 4,
      align: "left",
    });
    xPos += colWidths[i];
  });

  doc.moveDown(0.3);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.margins.left + pageWidth, doc.y)
    .stroke();

  doc.font("Helvetica").fontSize(7);
  let yPos = doc.y + 5;

  for (const row of rows) {
    if (yPos > doc.page.height - doc.page.margins.bottom - 30) {
      doc.addPage();
      yPos = doc.page.margins.top;

      doc.font("Helvetica-Bold").fontSize(8);
      let hx = doc.page.margins.left;
      headers.forEach((header, hi) => {
        doc.text(header, hx + 2, yPos, {
          width: colWidths[hi] - 4,
          align: "left",
        });
        hx += colWidths[hi];
      });
      doc
        .moveTo(doc.page.margins.left, doc.y + 12)
        .lineTo(doc.page.margins.left + pageWidth, doc.y + 12)
        .stroke();
      doc.font("Helvetica").fontSize(7);
      yPos += 17;
    }

    let rx = doc.page.margins.left;
    row.forEach((cell, ci) => {
      doc.text(cell || "", rx + 2, yPos, {
        width: colWidths[ci] - 4,
        align: ci === 0 ? "left" : "right",
      });
      rx += colWidths[ci];
    });
    yPos += 14;
  }

  doc.moveDown(2);
  doc
    .fontSize(8)
    .text(
      "Parqueadero Publico Neiva - Documento generado automaticamente",
      { align: "center" }
    );

  doc.end();
  return doc;
}
