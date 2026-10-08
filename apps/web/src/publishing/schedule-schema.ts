import type {CollectionDefinition} from '../db/schema';
export function schedulingDefinition(previous:CollectionDefinition):CollectionDefinition{
 const def=structuredClone(previous),schema=(def.validator as any).$jsonSchema;
 schema.properties.state.enum=['scheduled',...schema.properties.state.enum];
 schema.properties.mode={enum:['now','schedule']};
 schema.properties.schedule={bsonType:['object','null'],additionalProperties:false,required:['localTime','timezone','utcOffset','utc'],properties:{localTime:{bsonType:'string'},timezone:{bsonType:'string'},utcOffset:{bsonType:'string'},utc:{bsonType:'date'}}};
 schema.properties.retryDeadlineAt={bsonType:'date'};
 return def;
}
