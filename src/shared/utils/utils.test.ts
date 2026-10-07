import { describe, it, expect } from "vitest";
import {
  encryptPlate,
  decryptPlate,
  hashPlate,
  maskPlate,
  encryptPlateToBuffer,
  decryptPlateFromBuffer,
} from "./crypto.js";
import {
  roundDuration,
  calculateDurationMinutes,
  isWithinRange,
  addDays,
  addMinutes,
  formatDate,
  formatDateISO,
  todayRange,
} from "./date.js";
import {
  isValidColombianPlate,
  isValidInternationalPlate,
  isValidPlate,
  normalizePlate,
} from "./plate.js";
import {
  generateTransactionId,
  generateClaimId,
  generateSubscriptionId,
  generateCreditId,
  generateTicketNumber,
} from "./ids.js";

describe("Utils - crypto (RNF-SEG-002)", () => {
  it("cifra y descifra una placa (AES-256-GCM)", () => {
    const { encrypted, iv, tag } = encryptPlate("ABC-123");
    expect(decryptPlate(encrypted, iv, tag)).toBe("ABC-123");
  });

  it("cifra y descifra desde buffer", () => {
    const buffer = encryptPlateToBuffer("XYZ-987");
    expect(decryptPlateFromBuffer(buffer)).toBe("XYZ-987");
  });

  it("hashPlate es deterministico y no reversible", () => {
    const a = hashPlate("ABC-123");
    const b = hashPlate("abc-123");
    expect(a).toBe(b);
    expect(a).not.toContain("ABC");
    expect(a.length).toBe(64);
  });

  it("maskPlate enmascara los ultimos caracteres", () => {
    expect(maskPlate("ABC-123")).toMatch(/^ABC/);
    expect(maskPlate("ABC-123")).toContain("*");
  });
});

describe("Utils - date (RF-SALIDA-002)", () => {
  it("primeros 15 minutos son gratis", () => {
    expect(roundDuration(10)).toBe(0);
    expect(roundDuration(15)).toBe(0);
  });

  it("redondea hacia arriba por hora", () => {
    expect(roundDuration(16)).toBe(1);
    expect(roundDuration(60)).toBe(1);
    expect(roundDuration(61)).toBe(2);
    expect(roundDuration(120)).toBe(2);
    expect(roundDuration(121)).toBe(3);
  });

  it("calcula la duracion en minutos", () => {
    const entry = new Date("2026-09-27T10:00:00Z");
    const exit = new Date("2026-09-27T12:30:00Z");
    expect(calculateDurationMinutes(entry, exit)).toBe(150);
  });

  it("isWithinRange respeta los limites", () => {
    const d = new Date("2026-09-27T10:00:00Z");
    expect(isWithinRange(d, new Date("2026-09-27T00:00:00Z"), new Date("2026-09-28T00:00:00Z"))).toBe(true);
    expect(isWithinRange(d, new Date("2026-09-28T00:00:00Z"))).toBe(false);
    expect(isWithinRange(d, undefined, new Date("2026-09-26T00:00:00Z"))).toBe(false);
  });

  it("addDays y addMinutes suman correctamente", () => {
    const base = new Date("2026-09-27T10:00:00Z");
    expect(addDays(base, 30).getDate()).toBe(27);
    expect(addMinutes(base, 30).getTime() - base.getTime()).toBe(30 * 60000);
  });

  it("formatDate usa locale es-CO", () => {
    const out = formatDate(new Date("2026-09-27T10:00:00Z"));
    expect(typeof out).toBe("string");
    expect(out).toContain("2026");
  });

  it("formatDateISO entrega un formato ISO", () => {
    const out = formatDateISO(new Date("2026-09-27T10:00:00Z"));
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("todayRange cubre el dia completo", () => {
    const { from, to } = todayRange();
    expect(from.getTime()).toBeLessThanOrEqual(to.getTime());
    expect(from.getHours()).toBe(0);
    expect(to.getHours()).toBe(23);
  });
});

describe("Utils - plate (RF-RECEP-002/RF-RECEP-005)", () => {
  it("valida placas colombianas", () => {
    expect(isValidColombianPlate("ABC-123")).toBe(true);
    expect(isValidColombianPlate("ABC123")).toBe(true);
    expect(isValidColombianPlate("AB-123")).toBe(false);
  });

  it("valida placas internacionales", () => {
    expect(isValidInternationalPlate("BR-8821")).toBe(true);
    expect(isValidInternationalPlate("X")).toBe(false);
  });

  it("isValidPlate acepta ambas", () => {
    expect(isValidPlate("ABC-123")).toBe(true);
    expect(isValidPlate("BR-8821")).toBe(true);
  });

  it("normalizePlate quita espacios y guiones", () => {
    expect(normalizePlate("abc-123")).toBe("ABC123");
    expect(normalizePlate(" ab c 123 ")).toBe("ABC123");
  });
});

describe("Utils - ids", () => {
  it("genera IDs con formato esperado", () => {
    expect(generateTransactionId(1)).toMatch(/^TXN-\d{8}-00001$/);
    expect(generateClaimId(2)).toMatch(/^CLM-\d{8}-00002$/);
    expect(generateSubscriptionId(3)).toMatch(/^SUB-\d{6}-00003$/);
    expect(generateCreditId(4)).toMatch(/^CRD-\d{8}-00004$/);
    expect(generateTicketNumber()).toMatch(/^TKT-\d{8}-[A-Z0-9]+$/);
  });
});
