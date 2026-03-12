import {
  getMiredShift,
  kelvinToMired,
  solveForCamera,
  solveForLight
} from "../../lib/calculators/mired.js";
import { formatKelvin, formatKelvinExact, formatMired } from "../../lib/formatting/numbers.js";
import {
  getPracticalRangeWarning,
  getUiRangeWarning,
  parseKelvinInput
} from "../../lib/validation/kelvin.js";

const STORAGE_KEY = "mired-shift-calculator-state";

const defaultState = {
  mode: "light",
  originalLight: "4300",
  originalCamera: "5600",
  target: "3200",
  roundingMode: "exact"
};

const form = document.querySelector(".calculator-form");
const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
const presetButtons = Array.from(document.querySelectorAll(".preset-chip"));
const targetLabel = document.querySelector("[data-target-label]");
const targetHelp = document.querySelector("[data-target-help]");
const resultLabel = document.querySelector("[data-result-label]");
const resultValue = document.querySelector("[data-result-value]");
const shiftValue = document.querySelector("[data-shift-value]");
const interpretation = document.querySelector("[data-interpretation]");
const warningStack = document.querySelector("[data-warning-stack]");
const formulaOutput = document.querySelector("[data-formula-output]");
const copyButton = document.querySelector("[data-copy-result]");
const copyFeedback = document.querySelector("[data-copy-feedback]");
const fieldHelp = {
  originalLight: document.querySelector('[data-field-help="originalLight"]'),
  originalCamera: document.querySelector('[data-field-help="originalCamera"]'),
  target: document.querySelector('[data-field-help="target"]')
};

const baseHelpText = {
  originalLight: "Kelvin, positive number.",
  originalCamera: "Kelvin, positive number.",
  target: "Kelvin for the new camera white balance."
};

const state = loadState();
let lastSummary = "";
let lastFocusedName = "target";

applyStateToForm();
render();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    if (state.mode === "light" && state.target === "6600") {
      state.target = "3200";
    }
    if (state.mode === "camera" && state.target === "3200") {
      state.target = "6600";
    }
    saveState();
    applyStateToForm();
    render();
  });
});

form.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }

  state[target.name] = target.value;
  if (target instanceof HTMLInputElement) {
    lastFocusedName = target.name;
  }
  saveState();
  render();
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const activeField = form.elements.namedItem(lastFocusedName);
    if (!(activeField instanceof HTMLInputElement)) {
      return;
    }
    activeField.value = button.dataset.preset;
    state[activeField.name] = activeField.value;
    saveState();
    render();
    activeField.focus();
  });
});

copyButton.addEventListener("click", async () => {
  if (!lastSummary) {
    copyFeedback.textContent = "Nothing to copy yet.";
    return;
  }

  try {
    await navigator.clipboard.writeText(lastSummary);
    copyFeedback.textContent = "Copied.";
  } catch {
    copyFeedback.textContent = "Clipboard unavailable.";
  }
});

Array.from(form.querySelectorAll("input")).forEach((input) => {
  input.addEventListener("focus", () => {
    lastFocusedName = input.name;
  });
});

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return { ...defaultState };
    }

    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyStateToForm() {
  for (const [key, value] of Object.entries(state)) {
    const field = form.elements.namedItem(key);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
      field.value = value;
    }
  }

  const targetIsLight = state.mode === "camera";
  targetLabel.textContent = targetIsLight ? "New light source" : "New camera WB";
  targetHelp.textContent = targetIsLight
    ? "Kelvin for the new light source."
    : "Kelvin for the new camera white balance.";
  baseHelpText.target = targetHelp.textContent;
  resultLabel.textContent = targetIsLight ? "Required camera WB" : "Required light setting";

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function render() {
  applyStateToForm();
  copyFeedback.textContent = "";

  const originalLight = parseKelvinInput(state.originalLight);
  const originalCamera = parseKelvinInput(state.originalCamera);
  const target = parseKelvinInput(state.target);
  syncFieldState("originalLight", originalLight);
  syncFieldState("originalCamera", originalCamera);
  syncFieldState("target", target);

  const fieldStates = [originalLight, originalCamera, target];
  const firstError = fieldStates.find((entry) => entry.kind === "invalid");
  if (firstError) {
    setEmptyResult(firstError.message);
    return;
  }

  if (fieldStates.some((entry) => entry.kind === "empty")) {
    setEmptyResult("Enter the original light, original camera WB, and new target value.");
    return;
  }

  const inputWarnings = [
    getUiRangeWarning(originalLight.value),
    getUiRangeWarning(originalCamera.value),
    getUiRangeWarning(target.value)
  ].filter(Boolean);

  try {
    const calculation =
      state.mode === "light"
        ? solveForLight(originalLight.value, originalCamera.value, target.value)
        : solveForCamera(originalLight.value, originalCamera.value, target.value);

    const warnings = [...inputWarnings];
    const practicalWarning = getPracticalRangeWarning(calculation.resultKelvin);
    if (practicalWarning) {
      warnings.push(practicalWarning);
    }

    resultValue.textContent = formatKelvin(calculation.resultKelvin, state.roundingMode);
    shiftValue.textContent = `Original mired shift: ${formatMired(calculation.shift)}`;
    interpretation.textContent =
      state.mode === "light"
        ? `To maintain the same warmth relative to camera WB, set the light to ${formatKelvin(calculation.resultKelvin, state.roundingMode)}.`
        : `To preserve the same offset against a ${Math.round(target.value)}K source, set camera WB to ${formatKelvin(calculation.resultKelvin, state.roundingMode)}.`;
    renderWarnings(warnings);
    formulaOutput.textContent = buildFormulaText(originalLight.value, originalCamera.value, target.value, calculation);
    lastSummary = buildShareText(originalLight.value, originalCamera.value, target.value, calculation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to calculate result.";
    setEmptyResult(message);
  }
}

function setEmptyResult(message) {
  resultValue.textContent = "--";
  shiftValue.textContent = "Original mired shift: --";
  interpretation.textContent = message;
  renderWarnings([]);
  formulaOutput.textContent = "Waiting for valid inputs.";
  lastSummary = "";
}

function syncFieldState(fieldName, fieldState) {
  const field = form.elements.namedItem(fieldName);
  const help = fieldHelp[fieldName];
  if (!(field instanceof HTMLInputElement) || !(help instanceof HTMLElement)) {
    return;
  }

  const isInvalid = fieldState.kind === "invalid";
  field.classList.toggle("is-invalid", isInvalid);
  help.classList.toggle("is-error", isInvalid);
  help.textContent = isInvalid ? fieldState.message : baseHelpText[fieldName];
}

function renderWarnings(warnings) {
  warningStack.innerHTML = "";
  warningStack.hidden = warnings.length === 0;

  warnings.forEach((warning) => {
    const item = document.createElement("p");
    item.className = "warning-pill";
    item.textContent = warning;
    warningStack.append(item);
  });
}

function buildFormulaText(originalLightKelvin, originalCameraKelvin, targetKelvin, calculation) {
  const originalLightMired = kelvinToMired(originalLightKelvin);
  const originalCameraMired = kelvinToMired(originalCameraKelvin);
  const targetMired = kelvinToMired(targetKelvin);
  const operation =
    state.mode === "light"
      ? `${targetMired.toFixed(2)} + ${calculation.shift.toFixed(2)}`
      : `${targetMired.toFixed(2)} - ${calculation.shift.toFixed(2)}`;

  return [
    `Original light: ${formatKelvinExact(originalLightKelvin)} = ${originalLightMired.toFixed(2)} mired`,
    `Original camera WB: ${formatKelvinExact(originalCameraKelvin)} = ${originalCameraMired.toFixed(2)} mired`,
    `Original shift: ${originalLightMired.toFixed(2)} - ${originalCameraMired.toFixed(2)} = ${calculation.shift.toFixed(2)} mired`,
    state.mode === "light"
      ? `New camera WB: ${formatKelvinExact(targetKelvin)} = ${targetMired.toFixed(2)} mired`
      : `New light source: ${formatKelvinExact(targetKelvin)} = ${targetMired.toFixed(2)} mired`,
    `Result mired: ${operation} = ${calculation.resultMired.toFixed(2)} mired`,
    `Result Kelvin: 1000000 / ${calculation.resultMired.toFixed(2)} = ${formatKelvinExact(calculation.resultKelvin)}`
  ].join("\n");
}

function buildShareText(originalLightKelvin, originalCameraKelvin, targetKelvin, calculation) {
  const targetLabelText = state.mode === "light" ? "New camera" : "New light";
  const resultLabelText = state.mode === "light" ? "Required light" : "Required camera";

  return [
    `Original: Light ${Math.round(originalLightKelvin)}K / Camera ${Math.round(originalCameraKelvin)}K`,
    `Shift: ${formatMired(getMiredShift(originalLightKelvin, originalCameraKelvin))}`,
    `${targetLabelText}: ${Math.round(targetKelvin)}K`,
    `${resultLabelText}: ${formatKelvin(calculation.resultKelvin, state.roundingMode)}`
  ].join("\n");
}
