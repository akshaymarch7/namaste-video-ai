import type {CollectionDefinition} from '../db/schema';
export function snapshotCandidateDefinition(original:CollectionDefinition):CollectionDefinition{
 const definition=structuredClone(original);
 definition.validator.$jsonSchema.properties.plannerConfig.properties.provider.enum=['gemini','manual'];
 return definition;
}
