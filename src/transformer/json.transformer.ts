import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';


export type JsonContent = null|boolean|number|string|JsonObject|JsonArray;

export interface JsonObject {
    [key: string]: JsonContent;
}

export interface JsonArray extends Array<JsonContent> {}

export class JsonTransformer implements ValueTransformer {
    from(data : null|string) {
        return data && JSON.parse(data);
    }
    
    to(data : JsonContent) {
        return data == null ? null : JSON.stringify(data)
    }
};
