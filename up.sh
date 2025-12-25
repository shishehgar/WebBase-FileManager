#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/home/ubuntu/my_services"
PROJ_DIR="/home/ubuntu/my_services/filemanager_project"
PROJ_NAME="filemanager_project"

cd "$PROJ_DIR"

# Base compose for the project + project-local overrides + root-level global overrides if you use them.
# You can add/remove override files safely over time.
docker compose -p "$PROJ_NAME" \
  --env-file "$ROOT_DIR/.env" \
  -f "$PROJ_DIR/docker-compose.yml" \
  -f "$PROJ_DIR/overrides/docker-compose.hardening.override.yml" \
  -f "$PROJ_DIR/overrides/docker-compose.nonroot.override.yml" \
  -f "$PROJ_DIR/overrides/docker-compose.ports.override.yml" \
  -f "$PROJ_DIR/overrides/docker-compose.profiles.override.yml" \
  up -d
