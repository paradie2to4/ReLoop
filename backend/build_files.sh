#!/bin/bash
set -e
python3.12 -m pip install --break-system-packages -r requirements.txt
python3.12 manage.py collectstatic --noinput --clear
# Apply new database migrations (e.g. the MoMo payments table) on every deploy.
# Uses DATABASE_URL from the Vercel project's environment variables.
python3.12 manage.py migrate --noinput
