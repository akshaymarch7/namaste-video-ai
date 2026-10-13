import type {CollectionDefinition} from '../db/schema';
export function providerCandidateDefinition(original:CollectionDefinition):CollectionDefinition {
 const definition=structuredClone(original);
 definition.validator.$jsonSchema.properties.plannerConfig.properties.provider.enum=['gemini','manual','openai'];
 return definition;
}
