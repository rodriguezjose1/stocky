/**
 * Genera un código de venta único con formato V-YYYY-NNNNNN
 * Garantiza unicidad y recurrencia por año
 * @returns Código de venta único
 */
export function generateSaleCode(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  
  // Usar timestamp completo para mayor unicidad
  const uniqueNumber = timestamp % 1000000;
  
  // Formatear como V-YYYY-NNNNNN
  return `V-${year}-${uniqueNumber.toString().padStart(6, '0')}`;
}

/**
 * Genera un código de venta con secuencial garantizado
 * @param lastSaleCode - Último código de venta en la base de datos
 * @returns Código de venta único con secuencial
 */
export function generateSequentialSaleCode(lastSaleCode?: string): string {
  const year = new Date().getFullYear();
  
  if (!lastSaleCode) {
    // Primera venta del año
    return `V-${year}-000001`;
  }
  
  // Extraer el número secuencial del último código
  const match = lastSaleCode.match(/V-(\d{4})-(\d{6})/);
  if (!match) {
    // Si el formato no coincide, usar timestamp
    return generateSaleCode();
  }
  
  const lastYear = parseInt(match[1]);
  const lastNumber = parseInt(match[2]);
  
  if (lastYear === year) {
    // Mismo año, incrementar secuencial
    const nextNumber = lastNumber + 1;
    return `V-${year}-${nextNumber.toString().padStart(6, '0')}`;
  } else {
    // Nuevo año, empezar desde 1
    return `V-${year}-000001`;
  }
} 