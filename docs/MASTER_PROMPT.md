# Prompt Maestro — Atlas Cronológico Universal

## Propósito

Este prompt debe usarse para generar nuevas entidades históricas para el Atlas Cronológico Universal. Garantiza coherencia estructural, rigor académico y trazabilidad de fuentes en todo el dataset.

---

## PROMPT BASE (copiar y personalizar)

```
Soy el editor del Atlas Cronológico Universal, una plataforma académica interactiva de historia universal.

Necesito que generes un conjunto de entidades históricas para el tema: **[TEMA]**

El tema cubre el período **[AÑO INICIO – AÑO FIN]** en la región **[REGIÓN]**.
Las disciplinas principales son: **[DISCIPLINAS]** (arquitectura, arte, música, literatura, ciencia, tecnología, filosofía, política, etc.)

---

REGLAS OBLIGATORIAS:

1. NO INVENTES DATOS. Cada dato (fecha, lugar, nombre, obra, relación) debe ser real y verificable.

2. FUENTES: Cada entidad debe citar al menos una fuente fiable de alta fiabilidad (libro académico, museo oficial, enciclopedia académica, UNESCO, archivo nacional, universidad). Las fuentes deben existir realmente.

3. PRIORIDAD DE FUENTES:
   - Oxford University Press, Cambridge University Press, Harvard University Press
   - Encyclopaedia Britannica, Stanford Encyclopedia of Philosophy
   - Museos oficiales (Met, British Museum, Louvre, Prado, MoMA, etc.)
   - UNESCO World Heritage
   - Library of Congress, Europeana, Gallica
   - Wikidata/Wikipedia: SOLO como identificadores o punto de partida, nunca como única fuente.

4. FECHAS:
   - Usar el campo datePrecision para indicar el nivel de certeza: exact | year | decade | century | approximate | debated
   - Si una fecha es debatida académicamente, indicarlo explícitamente en el campo notes de validation
   - Años antes de Cristo: formato "-447" (sin a.C.)

5. RELACIONES: Cada entidad debe incluir al menos 2 relaciones con otras entidades (del tema o del dataset existente). Usar solo tipos de relación del vocabulario controlado.

6. CAPA: Asignar la capa correcta según el nivel de detalle:
   - global: civilizaciones, períodos, movimientos universales
   - intermediate: correlaciones entre disciplinas, difusión cultural, redes de influencia
   - detailed: personas concretas, edificios, obras, inventos, instituciones

7. IMPORTANCIA: Asignar un valor 1-10 justificado por la relevancia histórica real del elemento.

8. DUPLICADOS: Verificar que el id no exista ya en el dataset. Usar kebab-case único y descriptivo.

9. VALIDACIÓN: El campo validation.status debe ser:
   - "verified": datos confirmados en múltiples fuentes fiables
   - "partially_verified": datos principales confirmados, algunos detalles inciertos
   - "needs_review": datos con incertidumbre significativa

---

TIPOS DE ENTIDAD DISPONIBLES:
person | event | work | building | movement | style | invention | place | city | civilization | institution | publication | artwork | technology | period

TIPOS DE RELACIÓN DISPONIBLES:
influenced | influenced_by | collaborated_with | opposed | contemporary_of | part_of | evolved_into | response_to | founded | created | belonged_to | commissioned | lived_in | caused | preceded | followed

DISCIPLINAS DISPONIBLES:
architecture | art | music | literature | science | technology | philosophy | religion | politics | economy | society | urbanism | cinema | history

---

FORMATO DE SALIDA:

Genera entre 8 y 20 entidades en formato JSON, siguiendo EXACTAMENTE esta estructura (sin inventar campos adicionales):

[
  {
    "id": "kebab-case-unico",
    "title": "Nombre completo",
    "type": "tipo-de-entidad",
    "disciplines": ["disciplina1", "disciplina2"],
    "historicalPeriods": ["id-del-periodo"],
    "startDate": "año o fecha ISO parcial",
    "endDate": "año o fecha ISO parcial o null",
    "datePrecision": "exact|year|decade|century|approximate|debated",
    "summary": "Una frase concisa (máx. 150 caracteres).",
    "description": "Párrafo académico de 100-200 palabras. Hechos verificados. Sin juicios de valor.",
    "importance": 7,
    "regions": ["Europe", "North Africa", etc.],
    "places": [
      {
        "name": "Ciudad o lugar",
        "lat": 00.000,
        "lng": 00.000,
        "wikidataId": "Q12345",
        "role": "descripción del papel del lugar"
      }
    ],
    "relations": [
      {
        "targetId": "id-entidad-relacionada",
        "relationType": "tipo-relacion",
        "strength": 3,
        "note": "Explicación breve opcional"
      }
    ],
    "sources": [
      {
        "title": "Título exacto de la obra",
        "author": "Apellido, Nombre",
        "publisher": "Editorial",
        "year": "año",
        "url": "https://... (si existe versión digital verificable)",
        "type": "book|paper|museum|archive|encyclopedia|database|primary_source",
        "reliability": "high|medium",
        "notes": "Observaciones sobre la fuente"
      }
    ],
    "media": [
      {
        "type": "image|audio|video|manuscript|score|map|model3d",
        "url": "https://... (solo recursos de dominio público o CC)",
        "caption": "Descripción de la imagen",
        "source": "Nombre del repositorio",
        "rights": "Public domain | CC BY-SA 3.0 | etc."
      }
    ],
    "validation": {
      "status": "verified|partially_verified|needs_review",
      "lastReviewed": "2025-01-01",
      "notes": "Notas sobre incertidumbre o debates académicos"
    },
    "layer": "global|intermediate|detailed",
    "tags": ["tag1", "tag2", "tag3"]
  }
]

---

DESPUÉS DE GENERAR LAS ENTIDADES:

1. Lista las entidades generadas con su id y type.
2. Indica qué relaciones conectan entre sí las nuevas entidades.
3. Indica qué entidades del dataset existente se conectan con las nuevas.
4. Señala cualquier dato aproximado o debatido.
5. Lista todas las fuentes usadas y confirma que son reales.

---

TEMA A DESARROLLAR: [INSERTAR TEMA AQUÍ]
```

---

## Ejemplos de uso del prompt

```
TEMA: Renacimiento italiano (arquitectura y artes, 1400–1550)
PERÍODO: 1400–1550
REGIÓN: Italia
DISCIPLINAS: arquitectura, arte, escultura, literatura
```

```
TEMA: Música barroca europea
PERÍODO: 1600–1750
REGIÓN: Europa
DISCIPLINAS: música, religión, política
```

```
TEMA: Arquitectura japonesa del período Edo
PERÍODO: 1603–1868
REGIÓN: Japón
DISCIPLINAS: arquitectura, religión, sociedad
```

```
TEMA: Ciencia islámica medieval
PERÍODO: 800–1200
REGIÓN: Oriente Medio, Persia, Al-Ándalus
DISCIPLINAS: ciencia, filosofía, medicina, astronomía, matemáticas
```

```
TEMA: Nueva York 1880–1940 (arquitectura y cultura)
PERÍODO: 1880–1940
REGIÓN: América del Norte
DISCIPLINAS: arquitectura, arte, música, economía
```

---

## Prompts especializados por tipo de entidad

### Añadir ARQUITECTO

```
Genera la entidad para el arquitecto [NOMBRE COMPLETO].
- Fechas de nacimiento y muerte verificadas
- Obras principales con fechas y ubicaciones
- Influencias recibidas y ejercidas
- Escuela o movimiento al que pertenece
- Fuentes: monografías académicas, museos, UNESCO
- Al menos 3 relaciones con otras entidades del dataset
```

### Añadir EDIFICIO

```
Genera la entidad para el edificio [NOMBRE].
- Arquitecto/s, cliente/comitente
- Fechas de proyecto, construcción, inauguración
- Estilo arquitectónico y materiales
- Localización exacta con coordenadas reales
- Estado actual y protecciones (Patrimonio UNESCO, etc.)
- Fuentes: web oficial del edificio, museos, publicaciones académicas
```

### Añadir MOVIMIENTO CULTURAL

```
Genera la entidad para el movimiento [NOMBRE].
- Período y geografía de desarrollo
- Figuras fundacionales verificadas
- Disciplinas afectadas
- Causas históricas (qué lo precedió o causó)
- Consecuencias (qué movimientos surgieron después)
- Al menos 4 relaciones con entidades existentes
```

### Añadir ACONTECIMIENTO HISTÓRICO

```
Genera la entidad para el acontecimiento [NOMBRE].
- Fecha exacta o aproximada con datePrecision
- Causas inmediatas y estructurales
- Consecuencias históricas principales
- Lugares involucrados con coordenadas
- Figuras históricas clave (como relaciones)
- Fuentes primarias o historiografía especializada
```

### Añadir CIUDAD

```
Genera la entidad para la ciudad [NOMBRE] en el período [PERÍODO].
- Coordenadas geográficas reales
- Papel histórico en el período cubierto
- Movimientos culturales o estilos que albergó
- Edificios, instituciones o personajes importantes (como relaciones)
- Transformaciones urbanas relevantes
```

### Añadir TECNOLOGÍA O INVENTO

```
Genera la entidad para [NOMBRE DEL INVENTO/TECNOLOGÍA].
- Inventor o inventores (si están documentados)
- Fecha de invención o desarrollo
- Impacto económico, social y cultural
- Difusión geográfica
- Relaciones con Revolución Industrial u otros sistemas técnicos
- Fuentes técnicas e históricas
```

### Añadir PERÍODO HISTÓRICO

```
Genera la entidad para el período [NOMBRE].
- Fechas de inicio y fin con datePrecision
- Características principales y factores definitorios
- Regiones donde se desarrolló
- Disciplinas más afectadas
- Civilizaciones, movimientos o acontecimientos clave como relaciones
```
