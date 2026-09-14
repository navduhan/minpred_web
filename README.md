# MINpred Web

MINpred Web is a multi-page Next.js interface and secure SLURM gateway for the
MINpred nitrogen mineralization enzyme predictor. It accepts protein or
nucleotide FASTA, retrieves protein accessions, manages private asynchronous
jobs, renders per-phase tables, and exports TSV, CSV, or JSON.

The web service does not run prediction locally. It transfers validated input
over pinned-key SSH, submits `deploy/hpc/run_minpred_web.slurm` with
`sbatch --parsable --wait`, retrieves allow-listed result tables, and removes
the remote working directory after a successful transfer. The HPC wrapper runs
the maintained standalone MINpred CLI through the cluster's `dl-gpu` module.

## Pages and features

- About, Prediction, Results, Structure, Download, and Help pages
- strict protein and nucleotide FASTA validation
- UniProtKB and NCBI Protein accession retrieval
- Phase I-IV selection with automatic Phase III-to-Phase IV class routing
- TransDecoder.LongOrfs translation matching the maintained standalone workflow
- private tokenized result links, resumable polling, and 30-day retention
- Cloudflare Turnstile, request limits, pinned SSH host keys, and non-root images
- secondary- and tertiary-structure tools when configured
- versioned standalone source archive with SHA-256 checksum

## Local interface development

```bash
npm ci
TURNSTILE_REQUIRED=false npm run dev
```

Open `http://localhost:3000/minpred`. Prediction requests require the SSH/SLURM
environment described in `deploy/README.md`; there is intentionally no local
prediction fallback.

## Quality checks

```bash
npm run lint
npm run build
```

## License

MINpred Web first-party code is distributed under the MIT License. S4PRED and
other external services retain their own licenses and terms.
