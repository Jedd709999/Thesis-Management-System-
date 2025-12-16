#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r backend/requirements.txt

python -c "import django; django.setup()" && python backend/manage.py collectstatic --no-input
python -c "import django; django.setup()" && python backend/manage.py migrate