# Private offline AI drafts and public review handoff

## One source of truth

The public repository owns the checksum-pinned English corpus at
`app/i18n/generated/en.source.json`. The private `gummyui-pro` repository is
the sole source of truth for model selection, model licences, offline model
runtime, AI drafts, exact-source translation caches, automated quality reports,
repairs, and founder-review evidence.

No target dictionary or unreviewed translation is tracked in this public
repository. Every target locale remains absent from routing, hreflang, sitemap,
search, and runtime dictionaries until the separate publication gate passes.

The current public source is `en-ebd18dc4a542`. The private workflow already
contains complete prior-revision drafts and caches. Its generator reuses only
exact source units whose text and approved model match, records the source
revisions reused, and sends only new or changed units to the model. Do not
create a second public model registry or regenerate unchanged copy.

## Canonical incremental generation

Run generation from the private repository. The offline flags are mandatory so
Transformers can resolve only models already present in the Hugging Face cache:

```sh
cd ../gummyui-pro

nix shell nixpkgs#python312 -c env \
  HF_HUB_OFFLINE=1 \
  TRANSFORMERS_OFFLINE=1 \
  HF_DATASETS_OFFLINE=1 \
  TOKENIZERS_PARALLELISM=false \
  .localisation-venv/bin/python \
  scripts/generate-localisation-drafts.py --locale fr
```

Use `--all` only after the private runtime, model-cache, source and boundary
preflights pass. The generator checks the current public source, resumes its
private per-locale cache, scans prior-revision private caches, reuses exact
source units for the same approved model, checkpoints every new batch, and
writes only beneath `gummyui-pro/localisation/drafts/<source-revision>`.

The private repository must run its canonical gates after generation:

```sh
cd ../gummyui-pro
nix develop path:. -c npm run localisation:drafts:require-all
nix develop path:. -c npm run localisation:quality:build
nix develop path:. -c npm run localisation:quality:check
```

Those commands validate message ordering, source-message checksums,
placeholders, protected spans, non-translatable records, model registry
provenance, draft checksums, quality-report checksums, source preservation,
target scripts, suspicious leakage, repetition, broken entities, control
characters, and extreme length ratios. Automated checks prioritize review;
they never approve language.

## Complementary public-safe review artifact

The public repository includes only a renderer for a canonical private draft.
It validates the private draft against the exact current English source, checks
its draft checksum and structural integrity, optionally consumes the matching
private quality report, and writes a local HTML file under the gitignored
`work/localisation-reviews` directory.

After the private current-revision draft and quality report exist:

```sh
npm run localisation:private-review -- \
  --draft ../gummyui-pro/localisation/drafts/en-ebd18dc4a542/fr.draft.json \
  --quality ../gummyui-pro/localisation/quality/en-ebd18dc4a542/fr.quality.json
```

The output is:

```text
work/localisation-reviews/en-ebd18dc4a542/fr.review.html
```

The renderer refuses a stale revision, altered draft checksum, missing,
reordered or stale message, changed placeholder/protected span/markup,
translated non-translatable source, incomplete generation provenance, or a
deployable output path.

The standalone page:

- is marked `noindex,nofollow,noarchive,nosnippet`;
- uses a deny-by-default CSP and no external resources or network access;
- shows source and target copy side by side;
- applies the target locale's real direction, including RTL;
- filters by search, category, warning, quality severity, and decision;
- surfaces expansion/contraction and private automated-quality warnings;
- records explicit approve, reject, pending, notes, reviewer name, and overall
  decision in local browser storage keyed by the private draft checksum; and
- exports checksum-bound local review decisions without modifying either
  repository.

The generated HTML contains unreviewed translations, so it stays beneath
`work`, must not be copied to `public`, committed, deployed, emailed, or treated
as a dictionary. Editable paid Pro source, secrets, release URLs, entitlements,
credentials, and customer data are not inputs.

## Public structural fixture

The public test uses three synthetic messages and a synthetic private-draft
shape. It validates the handoff, tamper rejection, source/protected/markup
integrity, RTL-capable rendering contract, noindex metadata, filters, and
explicit approve/reject controls without loading a model or reading a real
translation:

```sh
npm run test:localisation:review
```

The test runs only through a Nix-provided Python interpreter.

## Publication remains separate

Founder linguistic review, rendered responsive/accessibility review, RTL and
bidirectional checks, metadata/canonical review, and rollback evidence remain
mandatory. Only a separate reviewed promotion change may add a runtime
dictionary and atomically activate routes, switcher links, reciprocal
hreflang, sitemap/search entries, and rollback evidence. Neither the private
generator nor this local review renderer has a publication command.
