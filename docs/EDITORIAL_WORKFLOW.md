# Workflow Editorial — Atlas Cronológico Universal

## Visión general

El workflow define el proceso estándar para incorporar nuevas entidades al dataset. Garantiza que el contenido sea riguroso, trazable y coherente con la arquitectura del sistema antes de ser publicado.

---

## PASO 1 — Selección y alcance

**Objetivo**: Definir qué se va a añadir y por qué.

Decisiones previas:
- ¿Qué tema, período o región se va a cubrir?
- ¿A qué capa pertenece (global / intermedia / detallada)?
- ¿Cuántas entidades se van a añadir?
- ¿Qué relaciones tendrán con entidades ya existentes?

Revisar el dataset actual para evitar duplicados:
```bash
# Buscar si ya existe una entidad similar
grep -r "\"title\"" data/entities/ | grep -i "término-a-buscar"
```

---

## PASO 2 — Investigación y recopilación de fuentes

**Objetivo**: Reunir fuentes académicas fiables antes de escribir nada.

Proceso:
1. Identificar las 2-3 fuentes principales (libros académicos, museos, enciclopedias).
2. Verificar que las fuentes existen y son accesibles.
3. Anotar: título, autor, editorial, año, URL si existe.
4. Identificar datos exactos (fechas, lugares, nombres).
5. Identificar debates o incertidumbres existentes.

Fuentes a consultar por defecto:
- [Encyclopaedia Britannica](https://www.britannica.com)
- [Oxford Reference](https://www.oxfordreference.com)
- [The Metropolitan Museum of Art](https://www.metmuseum.org/toah/)
- [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu)
- [UNESCO World Heritage](https://whc.unesco.org)
- [Europeana](https://www.europeana.eu)
- [Library of Congress](https://www.loc.gov)

---

## PASO 3 — Generación de entidades con el Master Prompt

**Objetivo**: Generar las entidades en formato JSON correcto.

1. Abrir `docs/MASTER_PROMPT.md`.
2. Copiar el prompt base.
3. Rellenar los campos: TEMA, PERÍODO, REGIÓN, DISCIPLINAS.
4. Enviar a Claude (o al modelo de lenguaje configurado).
5. Revisar el output antes de aceptarlo.

**Nunca aceptar output sin revisión.** Verificar especialmente:
- Que las fechas sean correctas
- Que los lugares existan y tengan coordenadas reales
- Que las fuentes citadas existan realmente
- Que los ids sean únicos

---

## PASO 4 — Validación cruzada

**Objetivo**: Contrastar cada dato con al menos dos fuentes.

Para cada entidad nueva:
- [ ] Fecha verificada en ≥2 fuentes
- [ ] Lugar verificado con coordenadas reales
- [ ] Descripción no contradice las fuentes primarias
- [ ] Relaciones respaldadas por documentación académica
- [ ] Fuentes existen y son accesibles
- [ ] datePrecision refleja la certeza real

Asignar `validation.status` según:
- `verified`: todo confirmado en ≥2 fuentes de nivel ALTO
- `partially_verified`: lo principal confirmado, algún detalle incierto
- `needs_review`: solo una fuente o datos inciertos

---

## PASO 5 — Normalización de entidades

**Objetivo**: Asegurar coherencia con el resto del dataset.

Verificar:
- **id**: kebab-case, único, descriptivo. Sin mayúsculas, sin espacios.
- **tipo**: usar solo los tipos definidos en `types/entity.ts`
- **disciplinas**: usar solo las disciplinas del vocabulario controlado
- **relaciones**: usar solo los tipos de relación del vocabulario controlado
- **capa**: global / intermediate / detailed según el nivel de abstracción
- **importancia**: 1-10, calibrada en relación al resto del dataset

---

## PASO 6 — Creación de relaciones

**Objetivo**: Conectar las nuevas entidades con el grafo existente.

1. Identificar qué entidades del dataset existente se relacionan con las nuevas.
2. Añadir relaciones en ambas entidades si es relevante (bidireccional cuando sea importante).
3. Usar `strength` de 1 a 5 según la solidez de la evidencia.
4. Añadir `note` cuando la relación necesite explicación.

Herramienta de ayuda:
```bash
# Ver todas las relaciones existentes a una entidad
node -e "
const e = require('./data/entities/global.json');
e.filter(x => x.id === 'industrial-revolution')[0].relations.forEach(r => console.log(r));
"
```

---

## PASO 7 — Incorporación al dataset

**Objetivo**: Añadir las entidades al archivo JSON correcto.

Estructura de archivos:
```
data/entities/
  global.json       → civilizaciones, períodos, movimientos universales
  intermediate.json → correlaciones, movimientos regionales, redes culturales
  detailed.json     → personas, edificios, obras, inventos, instituciones
```

Proceso:
1. Abrir el archivo JSON de la capa correspondiente.
2. Añadir las nuevas entidades al array.
3. Validar que el JSON sea válido:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/entities/detailed.json', 'utf8')); console.log('JSON válido')"
```

4. Verificar que el build de Next.js sigue funcionando:

```bash
npm run build
```

---

## PASO 8 — Revisión editorial final

**Objetivo**: Garantizar coherencia textual y académica.

Revisión de textos:
- `summary`: máximo 150 caracteres, frase completa, en español
- `description`: 100-200 palabras, tono académico neutro, sin juicios de valor
- `tags`: 3-6 palabras clave relevantes, en minúsculas

Revisión de medios:
- Solo enlazar imágenes de dominio público o Creative Commons
- Verificar que las URLs son accesibles
- Incluir créditos y licencia en cada media item

Revisión final:
- [ ] Todos los textos en español correcto
- [ ] No hay afirmaciones sin respaldo de fuentes
- [ ] No hay datos marcados como `exact` que sean aproximados
- [ ] Los tags son útiles para búsqueda y filtrado
- [ ] Las imágenes tienen licencia libre verificada

---

## PASO 9 — Commit y versionado

**Objetivo**: Documentar qué se añadió y por qué.

```bash
git add data/entities/
git commit -m "dataset: añadir [TEMA] — [N] entidades (capa [CAPA])"
```

Mensaje de commit estándar:
```
dataset: añadir arquitectura Bauhaus — 8 entidades (capa detailed)

- Bauhaus (institución, 1919-1933)
- Walter Gropius (persona)
- Edificio Bauhaus Dessau (edificio)
- ...

Fuentes: Droste (Taschen, 2019), UNESCO, MoMA
Validación: todos los datos verificados en ≥2 fuentes de nivel ALTO
```

---

## Gestión de errores y correcciones

### Si se detecta un error en una entidad existente

1. Localizar el archivo JSON correspondiente.
2. Corregir el dato incorrecto.
3. Actualizar `validation.lastReviewed` a la fecha de hoy.
4. Si el status cambia, actualizarlo.
5. Añadir nota en `validation.notes` sobre qué se corrigió y por qué.
6. Commit con mensaje explicativo.

### Si una entidad debe eliminarse

Solo eliminar si:
- El dato es completamente incorrecto y no rescatable
- Es un duplicado exacto de otra entidad

En caso de duda: cambiar `validation.status` a `needs_review` y añadir nota, en lugar de eliminar.

---

## Organización del repositorio de datos

```
data/
  entities/
    global.json          ← capa global (civilizaciones, períodos, movimientos universales)
    intermediate.json    ← capa intermedia (correlaciones, difusión cultural)
    detailed.json        ← capa detallada (personas, edificios, obras, instituciones)
  periods.json           ← definición de períodos históricos (con color para visualización)
  disciplines.json       ← vocabulario controlado de disciplinas (con color e icono)

docs/
  MASTER_PROMPT.md       ← prompt reutilizable para generar nuevas entidades
  VALIDATION_METHODOLOGY.md ← reglas de validación y checklist
  EDITORIAL_WORKFLOW.md  ← este archivo
  ARCHITECTURE.md        ← arquitectura técnica del sistema

types/
  entity.ts              ← tipos TypeScript del modelo de datos

lib/
  data.ts                ← funciones de acceso al dataset
  filters.ts             ← lógica de filtrado
  dateUtils.ts           ← utilidades de fechas y años
```

---

## Roadmap de expansión del contenido

### Prioridad ALTA (próximas iteraciones)

1. **Renacimiento italiano** (arquitectura + arte, 1400–1550): Brunelleschi, Leonardo, Miguel Ángel, Palladio, Florencia, Roma
2. **Música barroca** (1600–1750): Bach, Vivaldi, Händel, Monteverdi, ópera
3. **Revolución científica** en detalle: Copérnico, Galileo, Newton, Royal Society
4. **Modernismo catalán completo**: Domènech i Montaner, Puig i Cadafalch, obras secundarias de Gaudí
5. **Viena 1880–1914**: Secesión, Klimt, Schiele, Loos, Mahler, Freud, Wittgenstein

### Prioridad MEDIA

6. **Civilización islámica clásica** (800–1200): Bagdad, Al-Ándalus, ciencia, arquitectura
7. **China imperial** (Han, Tang, Song, Ming)
8. **India clásica** (Imperio Maurya, Gupta, arquitectura templaria)
9. **Primer Modernismo (1920–1940)**: Mies, Gropius, Wright, CIAM
10. **Nueva York 1880–1940**: rascacielos, jazz, art déco

### Prioridad BAJA (largo plazo)

11. Civilizaciones precolombinas (Maya, Azteca, Inca)
12. África subsahariana clásica (Malí, Zimbabue, Etiopía)
13. Japón (Edo, Meiji, modernidad)
14. Período entreguerras en Europa (literatura, cine, música)
15. Posguerra y arquitectura del Movimiento Moderno tardío
