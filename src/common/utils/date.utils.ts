export const getWeekCode = (date = new Date()): string => {
  // Crear el primer día del año
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);

  // Ajustar para el primer lunes del año
  const dayOffset = firstDayOfYear.getDay() === 0 ? 1 : 8 - firstDayOfYear.getDay(); // 0 = Domingo, ajusta a Lunes
  const firstMonday = new Date(year, 0, 1 + dayOffset);

  // Calcular los días entre la fecha dada y el primer lunes
  const diff = (date.getTime() - firstMonday.getTime()) / 86400000;

  // Calcular el número de la semana
  const weekNumber = Math.ceil((diff + 1) / 7);

  const weekCode = `${new Date().getFullYear()}-${weekNumber}`;

  return weekCode;
};
