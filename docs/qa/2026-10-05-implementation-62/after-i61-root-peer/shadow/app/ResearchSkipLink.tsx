"use client";

import "./research-skip-link.css";

export default function ResearchSkipLink() {
  return <a className="research-skip-link" href="#research-content" onClick={(event) => {
    const content = document.getElementById("research-content");
    if (!content) return;
    // Keep source-workspace fragments and exact selection URLs intact.
    event.preventDefault();
    content.focus({ preventScroll: true });
    content.scrollIntoView({ block: "start" });
  }}>Skip to research content</a>;
}
