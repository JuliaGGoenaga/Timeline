# Metodología de Validación de Datos

## Principios generales

El Atlas Cronológico Universal adopta un enfoque académico riguroso para la incorporación de datos. Toda afirmación histórica debe poder ser trazada a una fuente fiable, y la incertidumbre debe ser marcada explícitamente en lugar de ocultada.

---

## Niveles de fiabilidad de fuentes

### Nivel ALTO (reliability: "high")

Fuentes primarias o secundarias especializadas publicadas por instituciones académicas reconocidas:

- **Enciclopedias académicas**: Encyclopaedia Britannica, Oxford Reference, Stanford Encyclopedia of Philosophy, Grove Music Online
- **Editoriales universitarias**: Oxford University Press, Cambridge University Press, Harvard University Press, Princeton University Press, Chicago University Press
- **Museos e instituciones culturales oficiales**: The Metropolitan Museum of Art, British Museum, Louvre, Prado, MoMA, Tate, Uffizi
- **Organismos internacionales**: UNESCO (World Heritage, ICOMOS, IUCN), Library of Congress, Europeana
- **Archivos nacionales**: Archives Nationales (Francia), The National Archives (UK), Bundesarchiv (Alemania)
- **Fuentes primarias digitalizadas**: Gallica (BnF), Internet Archive (textos históricos), JSTOR

### Nivel MEDIO (reliability: "medium")

- Wikipedia y Wikidata: útiles como punto de partida y para identificadores, pero NUNCA como única fuente
- Publicaciones de museos locales o regionales sin revisión académica externa
- Artículos de divulgación firmados por especialistas pero no peer-reviewed
- Páginas web institucionales de edificios, organizaciones o fundaciones

---

## Niveles de precisión de fechas (datePrecision)

| Valor | Significado | Ejemplo |
|-------|-------------|---------|
| `exact` | Fecha día/mes/año documentada con certeza | "1889-03-31" (inauguración Torre Eiffel) |
| `year` | Año documentado con certeza | "1769" (patente de Watt) |
| `decade` | Período de diez años | Inicio de la década de 1860 |
| `century` | Período de cien años | "siglo V a.C." |
| `approximate` | Estimación académicamente aceptada con margen | c. 3100 a.C. para la unificación de Egipto |
| `debated` | Existen discrepancias entre fuentes académicas | Algunos debates sobre inicio del Renacimiento |

---

## Estados de validación

### `verified`
- El dato está confirmado en al menos dos fuentes de nivel ALTO independientes.
- Las fechas, lugares y nombres son consistentes entre fuentes.
- No existen debates académicos significativos sobre el dato.

### `partially_verified`
- Los datos principales están confirmados en al menos una fuente de nivel ALTO.
- Algunos detalles secundarios (fechas exactas, atribuciones secundarias) tienen cierta incertidumbre.
- Se indica en el campo `notes` qué aspectos necesitan verificación adicional.

### `needs_review`
- El dato procede de una sola fuente o de fuentes de nivel MEDIO.
- Existe debate académico sobre el dato.
- El dato fue incluido provisionalmente y requiere contraste adicional.
- Se indica claramente el motivo en el campo `notes`.

---

## Reglas de validación por tipo de dato

### Fechas

**Regla 1 — Consistencia de rangos**  
`startDate` debe ser siempre anterior a `endDate`. Si no hay `endDate`, el elemento está en curso o sin fin documentado.

**Regla 2 — Precisión coherente**  
Una fecha marcada como `exact` debe incluir día, mes y año (formato ISO: "1889-03-31"). Una fecha marcada como `year` incluye solo el año ("1769").

**Regla 3 — Siglos y milenios**  
Para períodos amplios: usar `century` o `approximate`. Nunca poner "1300" como `exact` para el inicio del Renacimiento; usar `approximate` o `decade`.

**Regla 4 — Debate histórico**  
Si distintas fuentes académicas dan fechas distintas (ej. inicio del Renacimiento: 1300 según algunos, 1400 según otros), usar `debated` y documentar el debate en `notes`.

### Lugares

**Regla 5 — Coordenadas reales**  
Las coordenadas `lat` y `lng` deben ser precisas para la ubicación concreta (no el centro de un país). Verificar con mapas geográficos.

**Regla 6 — Nombres históricos vs. actuales**  
Usar el nombre más reconocible académicamente. Si el nombre ha cambiado, indicarlo en `role`. Ejemplo: "Constantinopla" (hoy Estambul).

**Regla 7 — wikidataId**  
Proporcionar el identificador Q de Wikidata para lugares cuando sea posible, como apoyo técnico para verificación.

### Relaciones

**Regla 8 — Relaciones verificadas**  
No establecer relaciones especulativas. Si la influencia de A sobre B no está documentada en fuentes académicas, no incluirla.

**Regla 9 — Strength basado en evidencia**  
- 5: Influencia directa, documentada, reconocida unánimemente
- 4: Influencia bien documentada, reconocida mayoritariamente
- 3: Influencia probable, respaldada por algunas fuentes
- 2: Influencia posible, sugerida en la literatura
- 1: Influencia muy especulativa o indirecta

**Regla 10 — Simetría de relaciones**  
Si A `influenced` B, B tiene implícitamente `influenced_by` A. No duplicar en sentido contrario salvo que sea necesario para claridad.

### Fuentes

**Regla 11 — Existencia real**  
Toda fuente citada debe existir realmente. Verificar autor, título, editorial y año antes de incluir. No inventar ISBN ni URLs que no se hayan visitado.

**Regla 12 — URLs verificadas**  
Si se incluye una URL, debe ser accesible y apuntar al recurso concreto. Evitar URLs genéricas de homepage de museos.

**Regla 13 — No autocitar**  
No usar el Atlas como fuente de sí mismo. Todo dato debe tener fuente externa.

---

## Situaciones especiales

### Debate historiográfico

Cuando exista debate académico sobre una interpretación o fecha:

1. Marcar `datePrecision: "debated"`.
2. Explicar el debate en `validation.notes`.
3. Citar las fuentes de ambas posiciones si es posible.
4. Marcar `validation.status: "partially_verified"` o `"needs_review"`.
5. NO tomar partido por una interpretación sin consenso académico claro.

Ejemplo: "La fecha de inicio del Renacimiento es debatida. Algunos historiadores la sitúan en 1300 (Petrarca, Dante), otros en 1400 (Brunelleschi, Masaccio). Ver: Burke, P. (1987); Nauert, C. (1995)."

### Atribución de obras

Cuando la atribución de una obra a un autor sea debatida:

1. Indicar la atribución mayoritaria como principal.
2. Señalar alternativas en `description`.
3. Marcar `validation.status: "partially_verified"`.
4. Citar fuentes de ambas posiciones.

### Datos sin fecha documentada

Si se desconoce la fecha exacta pero se puede acotar:

1. Usar el rango más estrecho razonablemente documentado.
2. Marcar `datePrecision: "approximate"`.
3. Documentar la lógica del rango en `validation.notes`.

---

## Checklist de validación antes de añadir una entidad

- [ ] ¿El id es único y no existe ya en el dataset?
- [ ] ¿El título es el nombre más usado académicamente?
- [ ] ¿Las fechas son coherentes (start < end)?
- [ ] ¿La datePrecision refleja el nivel real de certeza?
- [ ] ¿Las coordenadas de lugares son correctas?
- [ ] ¿Las relaciones están respaldadas por fuentes?
- [ ] ¿Hay al menos una fuente de nivel ALTO?
- [ ] ¿Las fuentes existen realmente y son verificables?
- [ ] ¿Se han marcado explícitamente los datos aproximados o debatidos?
- [ ] ¿El validation.status es correcto según los criterios anteriores?
- [ ] ¿La importancia (1-10) refleja la relevancia histórica real y relativa?

---

## Sesgos a evitar

- **Eurocentrismo**: Dar igual peso a civilizaciones no europeas en las capas global e intermedia.
- **Presentismo**: No juzgar el pasado con valores del presente.
- **Simplificación extrema**: Evitar afirmaciones tipo "X inventó Y" si la historia es más compleja.
- **Gran hombre**: No reducir movimientos históricos a individuos únicos.
- **Sesgo de fuentes**: Contrastar con historiografía de distintas tradiciones académicas cuando sea relevante.
