import type { Entity } from '@/types';
import globalEntities               from '@/data/entities/global.json';
import intermediateEntities         from '@/data/entities/intermediate.json';
import detailedEntities             from '@/data/entities/detailed.json';
import global2                      from '@/data/entities/global2.json';
import global3                      from '@/data/entities/global3.json';
import intermediate2                from '@/data/entities/intermediate2.json';
import detailed2                    from '@/data/entities/detailed2.json';
import detailedRenacimientoItaliano from '@/data/entities/detailed_renacimiento_italiano.json';
import detailedGreciaClasica        from '@/data/entities/detailed_grecia_clasica.json';
import detailedIlustracion          from '@/data/entities/detailed_ilustracion.json';
import detailedMusicaBarroca        from '@/data/entities/detailed_musica_barroca.json';
import detailedVienaFinSiglo        from '@/data/entities/detailed_viena_fin_siglo.json';
import detailedSegundaRevolucion    from '@/data/entities/detailed_segunda_revolucion.json';
import detailedImpresionismoPintores from '@/data/entities/detailed_impresionismo_pintores.json';
import detailedRomaPersonasEdificios from '@/data/entities/detailed_roma_personas_edificios.json';
import detailedModernismeCatala     from '@/data/entities/detailed_modernisme_catala.json';
import detailedArquitecturaGotica   from '@/data/entities/detailed_arquitectura_gotica.json';
import detailedArquitecturaModerna  from '@/data/entities/detailed_arquitectura_moderna.json';
import detailedMusicaRomantica      from '@/data/entities/detailed_musica_romantica.json';
import global4                      from '@/data/entities/global4.json';
import global5                      from '@/data/entities/global5.json';
import intermediate3                from '@/data/entities/intermediate3.json';
import intermediate4                from '@/data/entities/intermediate4.json';
import intermediate5                from '@/data/entities/intermediate5.json';
import intermediate6                from '@/data/entities/intermediate6.json';
import intermediate7                from '@/data/entities/intermediate7.json';
import intermediate8                from '@/data/entities/intermediate8.json';
import intermediate9                from '@/data/entities/intermediate9.json';
import intermediate10               from '@/data/entities/intermediate10.json';
import intermediate11               from '@/data/entities/intermediate11.json';
import intermediate12               from '@/data/entities/intermediate12.json';
import intermediate13               from '@/data/entities/intermediate13.json';
import intermediate14               from '@/data/entities/intermediate14.json';
import intermediate15               from '@/data/entities/intermediate15.json';
import intermediate16               from '@/data/entities/intermediate16.json';
import intermediate17               from '@/data/entities/intermediate17.json';
import intermediate18               from '@/data/entities/intermediate18.json';
import intermediate19               from '@/data/entities/intermediate19.json';
import intermediate20               from '@/data/entities/intermediate20.json';
import intermediate21               from '@/data/entities/intermediate21.json';
import economiaPoliticaSociedad     from '@/data/entities/economia_politica_sociedad.json';
import monumentosEspana             from '@/data/entities/monumentos_espana.json';
import arquitecturaModerna          from '@/data/entities/arquitectura_moderna.json';
import arquitecturaModernaEspana    from '@/data/entities/arquitectura_moderna_espana.json';
import arquitecturaModernaEuropa    from '@/data/entities/arquitectura_moderna_europa.json';

export const ALL_ENTITIES: Entity[] = [
  ...globalEntities,
  ...global2,
  ...global3,
  ...intermediateEntities,
  ...intermediate2,
  ...detailedEntities,
  ...detailed2,
  ...detailedRenacimientoItaliano,
  ...detailedGreciaClasica,
  ...detailedIlustracion,
  ...detailedMusicaBarroca,
  ...detailedVienaFinSiglo,
  ...detailedSegundaRevolucion,
  ...detailedImpresionismoPintores,
  ...detailedRomaPersonasEdificios,
  ...detailedModernismeCatala,
  ...detailedArquitecturaGotica,
  ...detailedArquitecturaModerna,
  ...detailedMusicaRomantica,
  ...global4,
  ...global5,
  ...intermediate3,
  ...intermediate4,
  ...intermediate5,
  ...intermediate6,
  ...intermediate7,
  ...intermediate8,
  ...intermediate9,
  ...intermediate10,
  ...intermediate11,
  ...intermediate12,
  ...intermediate13,
  ...intermediate14,
  ...intermediate15,
  ...intermediate16,
  ...intermediate17,
  ...intermediate18,
  ...intermediate19,
  ...intermediate20,
  ...intermediate21,
  ...economiaPoliticaSociedad,
  ...monumentosEspana,
  ...arquitecturaModerna,
  ...arquitecturaModernaEspana,
  ...arquitecturaModernaEuropa,
] as Entity[];

export function getEntityById(id: string): Entity | undefined {
  return ALL_ENTITIES.find((e) => e.id === id);
}

export function getRelatedEntities(entity: Entity): Entity[] {
  const ids = entity.relations.map((r) => r.targetId);
  return ALL_ENTITIES.filter((e) => ids.includes(e.id));
}

export function getEntitiesByDiscipline(discipline: string): Entity[] {
  return ALL_ENTITIES.filter((e) => e.disciplines.includes(discipline as never));
}

export function getEntitiesWithCoordinates(): Entity[] {
  return ALL_ENTITIES.filter((e) => e.places.length > 0 && e.places[0].lat !== 0);
}
