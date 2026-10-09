import type { SvaraContactSelection } from "./svara-synaptic-contacts.js";

type PublicationRelation = Readonly<{ kind: "same_publication_label_navigation"; sourceId: string; releaseId: string;
  sourceGeometryVerified: false; physicalCellMappingEstablished: false; functionalTransmissionEstablished: false;
  coordinateTransformEstablished: false; byteAuthorityProvided: false }>;
export function svaraPublicationContactChoices(key: string): Readonly<{ relation: PublicationRelation; catalogueKey: string;
  choices: ReadonlyArray<{ selection: SvaraContactSelection; href: string; label: string; retainedEndpoint: "pre" | "post" }>;
  unavailableReason: string | null }>;
export function svaraContactCatalogueChoices(selection: SvaraContactSelection): Readonly<{ relation: PublicationRelation;
  choices: ReadonlyArray<{ role: "pre" | "post"; key: string; label: string; href: string }> }>;
