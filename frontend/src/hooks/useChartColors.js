import { useTheme } from "../useTheme";

// Los valores de recharts van a SVG attrs directos, no heredan CSS custom
// properties de forma fiable en todos los props, así que se leen aquí y
// se recalculan cuando cambia el theme.
export function useChartColors() {
  useTheme(); // fuerza re-render al cambiar de tema
  const styles = getComputedStyle(document.documentElement);
  const v = (name) => styles.getPropertyValue(name).trim();
  return {
    grid: v("--border-soft"),
    axis: v("--border"),
    tickText: v("--text-faint"),
    tooltipBg: v("--surface-raised"),
    tooltipBorder: v("--border"),
    tooltipLabel: v("--text-dim"),
    accent: v("--accent"),
    up: v("--up"),
    down: v("--down"),
  };
}
