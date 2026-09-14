# MINpred VM deployment

This deployment runs the Next.js application behind an unprivileged Nginx gateway on VM loopback port 3365. Prediction inputs are transferred over pinned-key SSH/SFTP to the configured cluster, submitted with `sbatch --parsable --wait`, and the allow-listed TSV result files are retrieved over SFTP.

## VM preparation

Install Docker Engine and its Compose plugin, then clone this repository. Create the runtime-only directories and environment file:

```bash
mkdir -p public/download deploy/data/jobs
cp deploy/docker.env.example deploy/docker.env
openssl rand -hex 32
```

Put the generated value in `JOB_OWNER_HMAC_SECRET`. Fill in the remaining placeholders in `deploy/docker.env`. The environment file and job data are ignored by Git.

Use a dedicated, restricted cluster SSH key. Verify the cluster ED25519 fingerprint with the cluster administrator through a separate trusted channel before setting `BIOCLUSTER_HOST_KEY_SHA256`:

```bash
ssh-keyscan -p 22 -t ed25519 biocluster.example.edu | ssh-keygen -lf - -E sha256
chmod 0600 /absolute/path/to/dedicated-private-key
```

`ssh-keyscan` discovers a key but does not establish trust by itself. Password authentication is not supported by this deployment.

Install the maintained standalone MINpred repository at `$HOME/naveen_tools/minpred`, or set `MINPRED_APP_DIR` to its absolute path. The standalone checkout supplies `minpred.sl` and `run_minpred_web.slurm`; set `BIOCLUSTER_REMOTE_SCRIPT` to the latter. The wrapper accepts `input.fasta level enzyme-class output-directory sequence-type`, uses `all` for automatic Phase III-to-Phase IV routing, loads the cluster's `dl-gpu` module, and delegates to `minpred.sl`. A checkout-local virtual environment created with `--system-site-packages` supplies only lightweight dependencies absent from the module while retaining its TensorFlow runtime. The launcher also exposes the TransDecoder installation bundled under the module prefix. Set `MINPRED_MODULE` or `MINPRED_MODEL_DIR` when the cluster layout differs. A nonzero predictor exit is returned to the web job unchanged.

## Start

The recommended interactive setup from the repository root is:

```bash
./start.sh
```

It safely creates `deploy/docker.env`, validates the selected Compose configuration, builds the images, starts the services, and performs a health check. Rootless Podman builds are serialized to one multi-stage build job to avoid overloading Buildah. On later runs, the menu can start existing images without rebuilding, pull Git updates and rebuild, or replace this project's containers and rebuild fresh images without cache while preserving job data and downloads. The corresponding direct modes are `--start-only`, `--update`, and `--rebuild`. To populate and validate the environment file without starting containers, run `./start.sh --configure-only`.

### Rootless Podman (recommended on RHEL-family VMs)

Install the external Compose provider, then run the deployment as the unprivileged VM user without `sudo`:

```bash
sudo dnf install -y podman-compose
podman info --format '{{.Host.Security.Rootless}}'
podman compose --env-file deploy/docker.env \
  -f deploy/compose.yaml \
  -f deploy/compose.podman.yaml \
  up -d --build
```

The rootless check must print `true`. The Podman overlay uses `keep-id` for the application process and private SELinux relabeling for its bind mounts. It also mounts the dedicated cluster key read-only; do not add `compose.ssh-key.yaml` to the Podman command.

### Docker Engine

```bash
docker compose --env-file deploy/docker.env -f deploy/compose.yaml -f deploy/compose.ssh-key.yaml up -d --build
```

The gateway listens only on `127.0.0.1:3365` by default. When the HTTPS reverse proxy is on another host, set `PUBLIC_BIND_ADDRESS` to the VM's private interface address and set `TRUSTED_PROXY_CIDR` to the reverse proxy's exact source address with a `/32` prefix. Restrict TCP port 3365 at the VM firewall to that same source address. Never expose the internal application container.

### Apache HTTPS reverse proxy

When Apache runs on a separate frontend host, add the following lines inside the existing HTTPS virtual host. Replace `MINPRED_PRIVATE_HOST` only in the server configuration; do not commit its private address:

```apache
ProxyRequests Off
ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Port "443"

ProxyPass        /minpred http://MINPRED_PRIVATE_HOST:3365/minpred connectiontimeout=5 timeout=720
ProxyPassReverse /minpred http://MINPRED_PRIVATE_HOST:3365/minpred
```

On the MINpred host, use its private interface for `PUBLIC_BIND_ADDRESS` and use the Apache host's private source address with a `/32` prefix for `TRUSTED_PROXY_CIDR`. Permit port 3365 only from that Apache source address. Then validate and reload Apache:

```bash
sudo apachectl configtest
sudo systemctl reload httpd
```

Check the deployment:

```bash
podman compose --env-file deploy/docker.env -f deploy/compose.yaml -f deploy/compose.podman.yaml ps
podman compose --env-file deploy/docker.env -f deploy/compose.yaml -f deploy/compose.podman.yaml logs -f app gateway
curl --fail http://127.0.0.1:3365/minpred
```

## Results retention

Private results are retained for 30 days by default (`PREDICTION_JOB_RETENTION_MS=2592000000`). Install the included cleanup command in the rootless Podman user's crontab, replacing `/absolute/path/to/minpred_web` with the cloned repository path:

```cron
17 3 * * * /absolute/path/to/minpred_web/deploy/prune-expired-jobs.sh
```

Run `crontab -e` as the same unprivileged user that owns `deploy/data/jobs`; do not install this in root's crontab. The application also prunes expired directories when accepting a new job.

Place release archives in `public/download/` only if direct downloads should be enabled. The directory is mounted at runtime and is never stored in Git or baked into the image.

## Structure prediction

The application image installs the pinned S4PRED source and verified model weights during the Docker build using `deploy/install-s4pred.sh`. Secondary-structure requests therefore run inside the application container. Tertiary structures use ESMFold for sequences up to 400 residues and SWISS-MODEL for longer proteins. Set `SWISS_MODEL_TOKEN` in `deploy/docker.env` to enable the longer-sequence fallback.

## Prediction execution policy

Prediction is cluster-only. The application has no local inference path and reports a clear job failure when SSH, SLURM, the `dl-gpu` module, the standalone checkout, or required TFLite models are unavailable.

The image build packages the standalone revision pinned in `deploy/package-standalone.sh` into `/download/minpred-standalone.tar.gz`, with `SHA256SUMS` and `REVISION.txt`. Do not mount an empty host folder over `/app/public/download`: it would hide the packaged files.

The web job launcher accepts `protein` or `nucleotide` as its fifth argument. Nucleotide jobs use `TransDecoder.LongOrfs` from the `dl-gpu` module and retain `translated_proteins.fasta` in the private job directory so structure requests use the translated protein identifiers and sequences. Protein and nucleotide usage examples are on the Help page.
