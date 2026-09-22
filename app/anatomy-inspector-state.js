function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function isSelectedStructureVisible(filteredStructures, selectedIdentifier) {
  assert(Array.isArray(filteredStructures), "Anatomy inspector filtered structures are invalid");
  return filteredStructures.some((structure) => structure?.identifier === selectedIdentifier);
}

export function buildPlanePresenceNavigation(planes, currentIndex) {
  assert(Array.isArray(planes) && planes.length > 0, "Anatomy inspector planes are missing");
  assert(
    Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < planes.length,
    "Anatomy inspector current plane index is invalid",
  );
  const presentIndices = [];
  planes.forEach((plane, index) => {
    assert(
      plane?.presence === "present" || plane?.presence === "missing",
      "Anatomy inspector plane presence is invalid",
    );
    if (plane.presence === "present") presentIndices.push(index);
  });
  const previousPresentIndex = presentIndices.filter((index) => index < currentIndex).at(-1) ?? null;
  const nextPresentIndex = presentIndices.find((index) => index > currentIndex) ?? null;
  return { presentIndices, previousPresentIndex, nextPresentIndex };
}
