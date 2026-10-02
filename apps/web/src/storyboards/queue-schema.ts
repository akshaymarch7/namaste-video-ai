import type {CollectionDefinition} from '../db/schema';
export function queuedReceiptDefinition(original:CollectionDefinition):CollectionDefinition{
 const definition=structuredClone(original);
 Object.assign(definition.validator.$jsonSchema.properties,{
  stage:{enum:['queued','planning','repairing','retrying','checking','ready','stopped']},
  attempt:{bsonType:'int',minimum:0,maximum:4},issueCodes:{bsonType:'array',maxItems:30,items:{bsonType:'string',maxLength:80}},
 });return definition;
}
