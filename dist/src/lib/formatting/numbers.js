export function formatKelvin(value, roundingMode = "exact") {
  if (!Number.isFinite(value)) {
    return "--";
  }

  if (roundingMode === "50" || roundingMode === "100") {
    const step = Number(roundingMode);
    return `${Math.round(value / step) * step}K`;
  }

  return `${Math.round(value)}K`;
}

export function formatKelvinExact(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return `${value.toFixed(2)}K`;
}

export function formatMired(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)} mired`;
}
