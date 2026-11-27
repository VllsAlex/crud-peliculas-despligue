FROM mongo:8
LABEL org.opencontainers.image.source="https://github.com/VllsAlex/crud-peliculas-despligue"

COPY movies.json /docker-entrypoint-initdb.d/movies.json
COPY --chmod=0755 01-importar-peliculas.sh /docker-entrypoint-initdb.d/01-importar-peliculas.sh
