const DEFAULT_UI_MIN = 1000;
const DEFAULT_UI_MAX = 40000;

export function parseKelvinInput(value) {
  const trimmed = String(value ?? "").trim();

  if (trimmed === "") {
    return { kind: "empty" };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return { kind: "invalid", message: "Enter a numeric Kelvin value." };
  }

  if (parsed <= 0) {
    return { kind: "invalid", message: "Kelvin must be greater than zero." };
  }

  return { kind: "valid", value: parsed };
}

export function getPracticalRangeWarning(kelvin) {
  if (kelvin < 1800 || kelvin > 20000) {
    return "Result may be outside the practical range of many fixtures or cameras.";
  }

  return null;
}

export function getUiRangeWarning(kelvin, min = DEFAULT_UI_MIN, max = DEFAULT_UI_MAX) {
  if (kelvin < min || kelvin > max) {
    return `Value is outside the suggested entry range of ${min}K to ${max}K.`;
  }

  return null;
}
