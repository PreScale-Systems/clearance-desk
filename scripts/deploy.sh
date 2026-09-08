#!/usr/bin/env bash
# Deploys Clearance Desk to Cloud Run with Vertex AI for Gemini and the Parallel API key in Secret Manager.
# Usage: PROJECT=my-project REGION=us-central1 ./scripts/deploy.sh
set -euo pipefail
PROJECT="${PROJECT:?set PROJECT}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-clearance-desk}"

gcloud config set project "$PROJECT" >/dev/null
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com \
  firestore.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com >/dev/null

if ! gcloud secrets describe parallel-api-key >/dev/null 2>&1; then
  read -rsp "Parallel API key: " KEY; echo
  printf '%s' "$KEY" | gcloud secrets create parallel-api-key --data-file=-
fi

gcloud firestore databases create --location="$REGION" >/dev/null 2>&1 || true

PN=$(gcloud projects describe "$PROJECT" --format 'value(projectNumber)')
SA="$PN-compute@developer.gserviceaccount.com"
for ROLE in roles/aiplatform.user roles/datastore.user roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT" --member "serviceAccount:$SA" --role "$ROLE" >/dev/null
done

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 1Gi --cpu 1 --concurrency 20 --timeout 900 \
  --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT,GOOGLE_CLOUD_LOCATION=$REGION,STORE=firestore" \
  --set-secrets "PARALLEL_API_KEY=parallel-api-key:latest"

gcloud run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)'
