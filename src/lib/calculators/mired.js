function assertPositiveFinite(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

export function kelvinToMired(kelvin) {
  assertPositiveFinite(kelvin, "Kelvin");
  return 1000000 / kelvin;
}

export function miredToKelvin(mired) {
  assertPositiveFinite(mired, "Mired");
  return 1000000 / mired;
}

export function getMiredShift(lightKelvin, cameraKelvin) {
  return kelvinToMired(lightKelvin) - kelvinToMired(cameraKelvin);
}

export function solveForLight(originalLightKelvin, originalCameraKelvin, newCameraKelvin) {
  const shift = getMiredShift(originalLightKelvin, originalCameraKelvin);
  const targetMired = kelvinToMired(newCameraKelvin) + shift;
  const resultKelvin = miredToKelvin(targetMired);

  return {
    mode: "light",
    shift,
    resultKelvin,
    resultMired: targetMired
  };
}

export function solveForCamera(originalLightKelvin, originalCameraKelvin, newLightKelvin) {
  const shift = getMiredShift(originalLightKelvin, originalCameraKelvin);
  const targetMired = kelvinToMired(newLightKelvin) - shift;
  const resultKelvin = miredToKelvin(targetMired);

  return {
    mode: "camera",
    shift,
    resultKelvin,
    resultMired: targetMired
  };
}
