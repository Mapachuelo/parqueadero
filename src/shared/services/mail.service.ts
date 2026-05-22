import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(options: MailOptions): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendPasswordChangeConfirmation(
  email: string,
  nombre: string
): Promise<void> {
  await sendMail({
    to: email,
    subject: "Confirmacion de cambio de contrasena - Parqueadero Neiva",
    text: `Hola ${nombre},\n\nTu contrasena ha sido cambiada exitosamente.\nSi no realizaste este cambio, contacta al administrador inmediatamente.\n\nParqueadero Publico Neiva`,
    html: `<p>Hola <strong>${nombre}</strong>,</p><p>Tu contrasena ha sido cambiada exitosamente.</p><p style="color:red">Si no realizaste este cambio, contacta al administrador inmediatamente.</p><p>Parqueadero Publico Neiva</p>`,
  });
}

export async function sendClaimStatusUpdate(
  email: string,
  nombre: string,
  claimId: string,
  newStatus: string
): Promise<void> {
  const statusMap: Record<string, string> = {
    abierto: "Abierto",
    en_investigacion: "En investigacion",
    resuelto: "Resuelto",
    rechazado: "Rechazado",
    vencido: "Vencido",
  };

  await sendMail({
    to: email,
    subject: `Reclamo ${claimId} actualizado - Parqueadero Neiva`,
    text: `Hola ${nombre},\n\nEl estado de tu reclamo ${claimId} ha cambiado a: ${statusMap[newStatus] || newStatus}.\n\nParqueadero Publico Neiva`,
    html: `<p>Hola <strong>${nombre}</strong>,</p><p>El estado de tu reclamo <strong>${claimId}</strong> ha cambiado a: <strong>${statusMap[newStatus] || newStatus}</strong>.</p><p>Parqueadero Publico Neiva</p>`,
  });
}
