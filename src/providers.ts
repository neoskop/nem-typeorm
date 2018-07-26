import { Provider } from '@neoskop/injector';
import { TYPEORM_ENTITIES } from './tokens';
import { Type } from '@neoskop/nem';

export function provideEntity(entity : Type<any>) : Provider {
    return { provide: TYPEORM_ENTITIES, useValue: entity, multi: true }
}
