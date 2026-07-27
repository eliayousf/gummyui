# Public and Private Repository Boundary

## Decision

Gummy UI uses two completely separate Git repositories.

| Repository | Visibility | Purpose |
|---|---|---|
| `gummyui` | Public | MIT components, registry, website, docs, free blocks, examples |
| `gummyui-pro` | Private | Paid block source, templates, design assets, release packages |

The public repository is itself the open-source area. There is no private
folder hidden inside it.

## Why two repositories

Git remembers file history. Adding paid files to a public repository and later
deleting them can leave recoverable copies in its history. Separate repositories
make accidental publication substantially less likely and keep licences clear.

## Public repository may contain

- Open-source component code
- Free block code
- Design tokens and themes
- Public registry JSON
- Website and documentation source
- Public catalogue names, descriptions, counts, and prices
- Reviewed source-free raster screenshots of Pro products
- Authentication and checkout integration code without credentials

## Public repository must never contain

- Editable Pro block or template source
- Compiled or minified Pro JavaScript, HTML, CSS, source maps, or design data;
  minification does not make paid source public-safe
- Original paid Figma/design files
- Customer data
- Stripe, email, storage, or signing secrets
- Private download URLs or unprotected release archives
- Proprietary prompt libraries or release automation containing credentials

## Private repository contains

- Pro block source and its tests
- Full-site template source
- Design-library source files
- Pro registry manifests
- Release archives and checksums
- Preview build inputs
- Internal catalogue and QA records

## Delivery model

The private repository produces two outputs:

1. Reviewed source-free raster preview images that may be shown on
   `gummyui.dev`.
2. Clean source packages delivered only after an account entitlement check.

Backups, hosted storage, payment records, and account data live in managed
services rather than either Git repository.
