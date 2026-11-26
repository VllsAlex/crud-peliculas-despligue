# Películas con MVC y Nunjucks

La aplicación permite gestionar películas de dos maneras: desde una API JSON o desde páginas HTML con formularios. Ambas utilizan el mismo modelo y las mismas funciones CRUD del controlador.

## 1. Instalación y arranque

Necesitas Node.js 20.19 o superior, npm y MongoDB.

Desde la carpeta del proyecto, instala las dependencias:

```bash
npm install
```

### Arrancar MongoDB con Docker Compose

Con Docker arrancado, ejecuta desde la carpeta del proyecto:

```bash
sudo docker compose up -d
```

El archivo `compose.yaml` utiliza la imagen `mongo:8`, publica el puerto `27017` y guarda las películas en el volumen `mongodb-movies-data`. `-d` deja el contenedor funcionando en segundo plano.

Para pararlo:

```bash
sudo docker compose down
```

El volumen conserva los datos al parar o volver a crear el contenedor. No añadas `-v` a `down` si quieres conservarlos.

### Si ya tienes el contenedor `mongodb-movies`

Compose crea su propio contenedor; no adopta automáticamente el anterior. Antes del primer arranque, comprueba la imagen y dónde guarda los datos tu contenedor actual:

```bash
sudo docker inspect mongodb-movies --format '{{.Config.Image}} {{json .Mounts}}'
```

Busca el montaje cuyo `Destination` sea `/data/db`:

- Si es de tipo `volume`, su `Name` debe coincidir con `name: mongodb-movies-data` en `compose.yaml`. Si es diferente, sustituye ese nombre en el archivo por el de tu volumen actual.
- Si es de tipo `bind`, sustituye `mongodb_data:/data/db` por la ruta que aparece en `Source`, seguida de `:/data/db`.
- Utiliza también la misma versión de MongoDB que tu contenedor anterior en `image`, para reutilizar sus datos.

Después, para el contenedor anterior para liberar el puerto y arranca el de Compose:

```bash
sudo docker stop mongodb-movies
sudo docker compose up -d
```

Este cambio solo se hace una vez. En adelante, basta con `sudo docker compose up -d`. El contenedor anterior no se elimina.

### Arrancar la aplicación

Crea un archivo `.env` en la raíz del proyecto con este contenido. También tienes estos valores en `.env.example`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/movies
PORT=3000
```

Arranca el servidor:

```bash
npm start
```

También puedes seguir utilizando `node index.js`. Si todo va bien aparecerá:

```text
conectado a MongoDB
listening on port 3000
```

Abre **http://localhost:3000**. Te llevará al listado de películas.

## 2. Estructura y responsabilidades

```text
index.js                       Arranca la aplicación.
app.js                         Configura Express, Nunjucks, MongoDB y las rutas.
compose.yaml                   Arranca MongoDB y conserva sus datos en un volumen.
models/
  movie.js                     Esquema y modelo de Mongoose.
controllers/
  movieController.js           Operaciones CRUD y datos enviados a las vistas.
routes/
  movieRoutes.js               Rutas de la API JSON.
  webRoutes.js                 Rutas de las páginas y formularios.
views/
  base.njk                     HTML común y navegación.
  movies.njk                   Listado de películas y filtro por género.
  detail.njk                   Información de una película.
  form.njk                     Formulario para añadir o editar.
  error.njk                    Mensajes de error.
```

**MVC significa Modelo, Vista y Controlador:**

- **Modelo**: define los datos de una película y sus validaciones con Mongoose.
- **Vista**: muestra HTML usando los datos que recibe del controlador. Nunca consulta MongoDB.
- **Controlador**: realiza las consultas con el modelo y decide qué respuesta enviar.
- Las **rutas** solo asocian cada petición con una función del controlador.

Por ejemplo, al abrir el listado:

1. El navegador pide `GET /web/movies`.
2. `webRoutes.js` ejecuta `listMovies` del controlador.
3. El controlador obtiene las películas con `Movie.find()`.
4. El controlador hace `res.render('movies.njk', { movies })`.
5. Nunjucks rellena la plantilla y Express devuelve el HTML al navegador.

Al pedir `GET /movies`, se ejecuta la misma función, pero devuelve `res.json(movies)`. La función `isWeb(req)` comprueba si la ruta empieza en `/web/movies` para distinguir ambas respuestas.

## 3. Interfaz web

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/web/movies` | Mostrar el listado |
| GET | `/web/movies?genre=Action` | Filtrar por género |
| GET | `/web/movies/new` | Mostrar el formulario para añadir |
| GET | `/web/movies/:id` | Mostrar una película |
| GET | `/web/movies/:id/edit` | Mostrar el formulario para editar |
| POST | `/web/movies` | Crear una película |
| POST | `/web/movies/:id/edit` | Guardar los cambios |
| POST | `/web/movies/:id/delete` | Eliminar una película |

Los formularios HTML utilizan POST para guardar, editar y eliminar porque no permiten enviar PATCH o DELETE directamente. Después de guardar o eliminar se redirige a una página con el resultado.

En el formulario, los géneros se escriben separados por comas, por ejemplo `Action, Adventure`. El controlador convierte ese texto en un array. El mismo formulario sirve para crear y editar gracias a la variable `editing`.

En Nunjucks, `{{ movie.title }}` muestra un dato, `{% for %}` recorre una lista y `{% if %}` comprueba una condición. Las plantillas utilizan `{% extends "base.njk" %}` para compartir el HTML común. `autoescape: true` hace que los textos introducidos se muestren como texto y no se interpreten como HTML.

## 4. API para Thunder Client

La API sigue disponible en `http://localhost:3000/movies`:

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/movies` | Obtener todas las películas |
| GET | `/movies/:id` | Obtener una película por su identificador de MongoDB |
| GET | `/movies?genre=Action` | Filtrar por género sin distinguir mayúsculas |
| POST | `/movies` | Crear una película |
| PATCH | `/movies/:id` | Modificar los campos enviados |
| DELETE | `/movies/:id` | Eliminar una película |

Ejemplo de JSON para crear una película (con `Content-Type: application/json`):

```json
{
  "title": "Interstellar",
  "genre": ["Adventure", "Sci-Fi"],
  "director": "Christopher Nolan",
  "year": 2014,
  "duration": 169,
  "rate": 8.7,
  "poster": ""
}
```

Para modificar solo la puntuación, envía `PATCH /movies/ID_DE_LA_PELICULA` con:

```json
{ "rate": 9 }
```

## 5. Validaciones y comprobación

- El título es obligatorio y se eliminan sus espacios al principio y al final.
- Mongoose comprueba el tipo de los campos: año, duración y puntuación son números; géneros es un array de textos.
- Solo se recogen los siete campos del modelo al crear o modificar.
- Un identificador con formato incorrecto devuelve **400**.
- Una película que no existe devuelve **404**.
- Los datos incorrectos devuelven **400**. Las actualizaciones también ejecutan las validaciones con `runValidators: true`.
- Los errores inesperados de base de datos devuelven **500**.

En la API los errores se devuelven como JSON y en la web se muestra `error.njk`. Express 5 envía los errores de las funciones `async` al manejador de errores que está al final de `app.js`.

Para comprobar el funcionamiento:

1. Añade una película desde la web y comprueba que aparece en el listado y en `GET /movies`.
2. Abre su detalle, edítala y comprueba los cambios con `GET /movies/:id`.
3. Filtra por uno de sus géneros.
4. Elimínala y comprueba que ya no aparece.
5. Desde Thunder Client, prueba también POST, PATCH y DELETE.
6. Prueba `/movies/abc`, un ID válido que no exista, un título vacío y un año con texto para comprobar los errores.

---
