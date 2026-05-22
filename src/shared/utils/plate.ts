export function isValidColombianPlate(plate: string): boolean {
  return /^[A-Z]{3}-?\d{3}$/i.test(plate);
}

export function isValidInternationalPlate(plate: string): boolean {
  return /^[A-Z0-9\s-]{3,15}$/i.test(plate);
}

export function isValidPlate(plate: string): boolean {
  return isValidColombianPlate(plate) || isValidInternationalPlate(plate);
}

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
}
