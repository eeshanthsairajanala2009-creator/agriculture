#!/usr/bin/env bash
# start.sh — KrishiSetu Nexus Root Start Script for Render
# Usage: bash start.sh
set -e
exec node backend/src/index.js
