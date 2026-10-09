import { SOURCE_IDENTITY_LEVELS, type SourceIdentityHierarchy, type SourceRelationship } from "./source-object-identity.js";
import "./source-identity-hierarchy.css";

const labels = { specimen: "Specimen", section: "Section", cell: "Cell", component: "Component / observation", synapse: "Synapse" };

export default function SourceIdentityHierarchyPanel({ hierarchy, relationship = null }: { hierarchy: SourceIdentityHierarchy; relationship?: SourceRelationship | null }) {
  return <details className="source-identity-hierarchy" data-testid="source-identity-hierarchy" data-identity-key={hierarchy.key}>
    <summary>Source identity and parent relationships</summary>
    <p>Identity follows this source, release and namespace. Unreported identifiers remain unknown.</p>
    <dl className="sih-scope"><div><dt>Source / release</dt><dd>{hierarchy.sourceId} · {hierarchy.releaseId}</dd></div><div><dt>Namespace</dt><dd><code>{hierarchy.namespace}</code></dd></div><div><dt>Selected object</dt><dd><code>{hierarchy.objectId}</code> · {hierarchy.objectKind.replaceAll("_", " ")}</dd></div><div><dt>Observation unit</dt><dd>{hierarchy.unit.replaceAll("_", " ")}</dd></div></dl>
    <ol className="sih-levels">{SOURCE_IDENTITY_LEVELS.map((level) => {
      const node = hierarchy.nodes[level], parent = hierarchy.parents[level];
      return <li key={level}><strong>{labels[level]}</strong><div>{node.status === "known" ? <code>{node.id}</code> : <span>{node.status === "not_applicable" ? "Not applicable" : node.status === "ambiguous" ? "Ambiguous · no identifier assigned" : "Unknown"}</span>}
        <small>{node.reason ?? (parent.status === "source_reported" ? `Source-reported parent: ${parent.parentId}` : parent.reason)}</small>
        {node.locator && <small className="sih-locator">Source: <code>{node.locator}</code></small>}
      </div></li>;
    })}</ol>
    {hierarchy.population.status === "known" && <p>Source population assignment: <code>{hierarchy.population.id}</code></p>}
    {relationship && <p className="sih-relation">{relationship.type.replaceAll("_", " ")} · {relationship.reason}</p>}
    <p className="sih-boundary">Parent identifiers describe the retained source relationship. Coordinate transforms, internal-layer eligibility and file verification are checked separately.</p>
  </details>;
}
