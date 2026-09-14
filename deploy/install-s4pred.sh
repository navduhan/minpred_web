#!/usr/bin/env bash
set -euo pipefail

S4PRED_COMMIT=5bc16ee55d98015ca4bbdc6741ab0c64f6f7744b
S4PRED_REPOSITORY=https://github.com/psipred/s4pred.git
S4PRED_WEIGHTS_URL=http://bioinfadmin.cs.ucl.ac.uk/downloads/s4pred/weights.tar.gz
S4PRED_WEIGHTS_MD5=e04ad7d10b61551f7e07a86b65bb88dc

git clone --filter=blob:none "$S4PRED_REPOSITORY" /opt/s4pred
git -C /opt/s4pred checkout --detach "$S4PRED_COMMIT"
curl --fail --location --retry 3 --output /tmp/s4pred-weights.tar.gz "$S4PRED_WEIGHTS_URL"
echo "$S4PRED_WEIGHTS_MD5  /tmp/s4pred-weights.tar.gz" | md5sum --check --strict
tar -xzf /tmp/s4pred-weights.tar.gz -C /opt/s4pred
rm -f /tmp/s4pred-weights.tar.gz
rm -rf /opt/s4pred/.git

python3 -m venv /opt/s4pred-venv
S4PRED_PIP=/opt/s4pred-venv/bin/pip
S4PRED_PYTHON=/opt/s4pred-venv/bin/python
PYPI_INDEX=https://pypi.org/simple
PYTORCH_CPU_INDEX=https://download.pytorch.org/whl/cpu

# Keep PyPI as the primary index so transitive build dependencies (for example,
# flit_core) are not looked up exclusively in the PyTorch wheel repository.
"$S4PRED_PIP" install --no-cache-dir \
    --index-url "$PYPI_INDEX" \
    typing-extensions==4.12.2 \
    numpy==1.26.4
"$S4PRED_PIP" install --no-cache-dir \
    --index-url "$PYPI_INDEX" \
    --extra-index-url "$PYTORCH_CPU_INDEX" \
    torch==2.2.2+cpu \
    biopython==1.83

"$S4PRED_PYTHON" -c 'import Bio, numpy, torch; assert torch.tensor([1.0]).numpy()[0] == 1.0; print("S4PRED runtime:", "Biopython", Bio.__version__, "NumPy", numpy.__version__, "PyTorch", torch.__version__)'

test -f /opt/s4pred/run_model.py
test -f /opt/s4pred/weights/weights_1.pt
