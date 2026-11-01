# Portada de la presentación

Para agregar una portada **sin reconstruir la imagen de Docker**, deja en esta carpeta:

- `cover.json`
- la imagen que indique (por ejemplo `cover.jpg`, 1920×1080)

```json
{
  "image": "cover.jpg",
  "title": "Del “¿cuánto cuesta?” al dato con el que decidimos",
  "subtitle": "Proyecto de Ingeniería de Software · Grupo 7 · UVG"
}
```

También se pueden cambiar `team` (lista de integrantes) y `meta` (tres líneas: universidad, curso y fecha).
Todos los campos son opcionales. La imagen se muestra a pantalla completa, atenuada, detrás de la portada. Sin `cover.json` se usa la pantalla de inicio por omisión.

Con `docker compose` esta carpeta ya está montada: guarda los archivos y recarga la página.
En desarrollo (`npm run dev`) copia los mismos archivos a `public/portada/`.
