# Scoped rollback

Restore only this iteration's hunks in existing files. Do not reset the dirty checkout.

- `preimages.zip` and `before-owned-inputs.json`: initial page/shell/document snapshots.
- `pin-preimages.zip` and `before-pin-owned-inputs.json`: renderer declaration and builder snapshots.
- `metadatapreimages.zip`: state immediately before adding page titles.
- `route-library-preimage.tsx.txt`: exact component before search/pagination.
- `manifest-delta.json`: comparison to the captured manifest; it includes concurrent science changes and is not a sole-ownership list.

The new page components, navigation files, CSS, catch-all routes and standalone `/sources` and `/workspace` routes can be removed only together with restoring their callers. Preserve concurrent changes to SceneCanvas, camera-fit helpers, native-contour diagnostics and scientific tests. Regenerate the current 2.91 manifest/runtime pins after any rollback. Never regenerate or overwrite frozen 2.90.
