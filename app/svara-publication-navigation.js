import canonical from "../data/svara-publication-navigation-0.1.json" with { type: "json" };
import { SVARA_CONTACTS, inspectSvaraContactSelection, svaraContactLink } from "./svara-synaptic-contacts.js";

const check = (ok, message) => { if (!ok) throw new Error(`Svara publication navigation: ${message}`); };
const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};
const index = freeze(canonical);
check(index.sourceId === SVARA_CONTACTS.sourceId && index.releaseId === SVARA_CONTACTS.releaseId,
  "exact article or release differs");
const relation = freeze({ ...index.relation, sourceId:index.sourceId, releaseId:index.releaseId });

export function svaraPublicationContactChoices(key) {
  const entry = index.entries.find(entry => entry.key === key);
  check(entry, "exact catalogue entry is unavailable; no replacement was selected");
  const matching = index.endpoints.filter(row => row.catalogueKey === key);
  const choices = matching.map(row => {
    const group = SVARA_CONTACTS.groups.find(group => group.id === row.group);
    check(group, "native contact group differs");
    const selection = inspectSvaraContactSelection({ group: row.group,
      pre: row.role === "pre" ? row.contactLabel : group.pre[0],
      post: row.role === "post" ? row.contactLabel : group.post[0] });
    return { selection, href: svaraContactLink(selection),
      label: `${selection.pre} → ${selection.post}`, retainedEndpoint: row.role };
  });
  return freeze({ relation, catalogueKey: entry.key, choices,
    unavailableReason: choices.length ? null :
      "This publication entry is not a column in either verified wiring workbook. No contact pair was substituted." });
}

export function svaraContactCatalogueChoices(selection) {
  const active = inspectSvaraContactSelection(selection);
  const choices = ["pre", "post"].map(role => {
    const row = index.endpoints.find(row => row.group === active.group && row.role === role &&
      row.contactLabel === active[role]);
    check(row, "exact publication label is unavailable");
    const entry = index.entries.find(entry => entry.key === row.catalogueKey);
    check(entry, "exact catalogue entry is unavailable");
    const query = new URLSearchParams({ svaraSource:index.sourceId, svaraRelease:index.releaseId, svaraEntry:entry.key });
    return { role, key:entry.key, label:entry.header, href:`/catalogues/svara?${query}` };
  });
  return freeze({ relation, choices });
}
