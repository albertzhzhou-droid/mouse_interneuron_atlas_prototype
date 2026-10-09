"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { SOURCE_AUDIT_WORKSPACES, sourceAuditWorkspaceForFragment } from "./source-audit-workspaces.js";
import "./source-audit-workspaces.css";

const views = {
  "source-xenium-metadata": lazy(() => import("./bil-xenium-metadata-explorer")),
  "source-exact-inputs": lazy(() => import("./ExactSourceAuditWorkbench")),
  "source-wt-planes": lazy(() => import("./janelia-wt-bounded-reference-viewer")),
  "source-comparative-swc": lazy(() => import("./ComparativeSwcReferenceWorkbench")),
};

class WorkspaceFailure extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <p role="alert">This workspace could not load. <button type="button" onClick={() => window.location.reload()}>Reload the source page</button></p>;
    return this.props.children;
  }
}

function DeferredWorkspace({ workspace, followFragments }: { workspace: typeof SOURCE_AUDIT_WORKSPACES[number]; followFragments: boolean }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const View = views[workspace.id];
  useEffect(() => {
    const sync = () => {
      const node = details.current;
      if (!node) return;
      // Preserve a native toggle made before hydration. Only an exact known
      // fragment opens a workspace; arbitrary source IDs never select one.
      if (followFragments && sourceAuditWorkspaceForFragment(window.location.hash) === workspace.id) {
        node.open = true;
        node.querySelector("summary")?.focus({ preventScroll: true });
        node.scrollIntoView({ block: "start" });
      }
      setOpen(node.open);
    };
    const timer = window.setTimeout(sync, 0);
    if (followFragments) window.addEventListener("hashchange", sync);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", sync); };
  }, [workspace.id, followFragments]);
  return <details className="source-audit-workspace" id={workspace.id} ref={details} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary><span>{workspace.title}</span><small>{workspace.description}</small></summary>
    {open && <div className="source-audit-workspace-body" data-source-workspace={workspace.id}>
      <a href={`/source-audits#${workspace.id}`}>Link to this workspace</a>
      <WorkspaceFailure><Suspense fallback={<p role="status">Loading the selected source workspace…</p>}><View /></Suspense></WorkspaceFailure>
    </div>}
  </details>;
}

export default function SourceAuditWorkspaces({ followFragments = false }: { followFragments?: boolean }) {
  return <section className="source-audit-workspaces" aria-label="Source audit workspaces">
    <p>Open a workspace to inspect its source files and controls. Closing releases the local view, saved-view preview and pending loading. Reopening creates a new view; supported workspaces restore their current URL bookmark and filters. Exported files remain available for restoration.</p>
    {SOURCE_AUDIT_WORKSPACES.map(workspace => <DeferredWorkspace key={workspace.id} workspace={workspace} followFragments={followFragments} />)}
  </section>;
}
