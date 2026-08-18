#!/bin/bash
set -e
python3.12 -m pip install --break-system-packages -r requirements.txt
python3.12 manage.py collectstatic --noinput --clear
