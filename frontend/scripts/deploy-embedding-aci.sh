#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# DEPLOY PPLX-EMBED TO AZURE CONTAINER INSTANCES
# ──────────────────────────────────────────────────────────────────────────────
# Deploys HuggingFace Text Embeddings Inference (TEI) running
# perplexity-ai/pplx-embed-v1-0.6b as an Azure Container Instance.
#
# All compute costs go through your Azure subscription — no external API charges.
#
# Prerequisites:
#   - Azure CLI installed and logged in (az login)
#   - Existing resource group
#
# Usage:
#   chmod +x scripts/deploy-embedding-aci.sh
#   ./scripts/deploy-embedding-aci.sh
#
# Cost estimate: ~$25-35/month (2 vCPU, 4GB RAM, CPU-only)
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-eusotrip-rg}"
LOCATION="${AZURE_LOCATION:-centralus}"
CONTAINER_NAME="eusotrip-pplx-embed"
DNS_LABEL="eusotrip-pplx-embed"
IMAGE="ghcr.io/huggingface/text-embeddings-inference:cpu-1.5"
MODEL_ID="perplexity-ai/pplx-embed-v1-0.6b"
CPU_CORES=2
MEMORY_GB=4
PORT=80

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  PPLX-EMBED — Azure Container Instance Deployment              ║"
echo "║  Model: ${MODEL_ID}                                            ║"
echo "║  Resource Group: ${RESOURCE_GROUP}                              ║"
echo "║  Location: ${LOCATION}                                         ║"
echo "║  CPU: ${CPU_CORES} cores | RAM: ${MEMORY_GB}GB                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# ── Check if container already exists ─────────────────────────────────────────
EXISTING=$(az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "name" \
  --output tsv 2>/dev/null || true)

if [ -n "$EXISTING" ]; then
  echo "⚠️  Container '$CONTAINER_NAME' already exists. Deleting for fresh deploy..."
  az container delete \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CONTAINER_NAME" \
    --yes
  echo "   Deleted. Waiting 10s..."
  sleep 10
fi

# ── Deploy Container Instance ─────────────────────────────────────────────────
echo "🚀 Deploying TEI container..."
az container create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --image "$IMAGE" \
  --cpu "$CPU_CORES" \
  --memory "$MEMORY_GB" \
  --ports "$PORT" \
  --dns-name-label "$DNS_LABEL" \
  --ip-address Public \
  --os-type Linux \
  --restart-policy Always \
  --environment-variables LOG_LEVEL=info \
  --command-line "/usr/local/bin/text-embeddings-router --model-id $MODEL_ID --port $PORT --max-batch-tokens 32768 --max-concurrent-requests 64 --dtype float32" \
  --location "$LOCATION"

# ── Get the FQDN ─────────────────────────────────────────────────────────────
FQDN=$(az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "ipAddress.fqdn" \
  --output tsv)

IP=$(az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "ipAddress.ip" \
  --output tsv)

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "✅ Deployment complete!"
echo ""
echo "   FQDN:  http://${FQDN}"
echo "   IP:    http://${IP}"
echo ""
echo "   Set this in your Azure App Service configuration:"
echo "   EMBEDDING_SERVICE_URL=http://${FQDN}"
echo ""
echo "   Test with:"
echo "   curl http://${FQDN}/health"
echo "   curl -X POST http://${FQDN}/v1/embeddings \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"input\": [\"test embedding\"], \"model\": \"perplexity-ai/pplx-embed-v1-0.6b\"}'"
echo ""
echo "   ⏳ First startup takes 2-3 minutes (model download)."
echo "   📊 Estimated cost: ~\$25-35/month (2 vCPU, 4GB RAM)"
echo "════════════════════════════════════════════════════════════════════"
