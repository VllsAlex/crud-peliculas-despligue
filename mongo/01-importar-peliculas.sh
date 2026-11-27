#!/bin/bash
set -e

# El servidor temporal de inicialización escucha solo en localhost, sin autenticación.
# El entrypoint carga este script con source; debe continuar al terminar la importación.
mongoimport \
  --host 127.0.0.1 \
  --port 27017 \
  --db movies \
  --collection movies \
  --file /docker-entrypoint-initdb.d/movies.json \
  --jsonArray \
  --stopOnError
