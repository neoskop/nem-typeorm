import { BOOTSTRAP_LISTENER_AFTER, NemModule, NemModuleWithProviders } from '@neoskop/nem';
import { createConnection } from 'typeorm';
import { ConnectionProxy, ConnectionProxy_ } from './connection-proxy';
import { TYPEORM_CONFIG, TYPEORM_CONNECTION_PROMISE, TYPEORM_ENTITIES, ConnectionConfig } from './tokens';


@NemModule()
export class TypeormModule {
    static forConfiguration(config : ConnectionConfig, migrations : { run?: boolean, undo?: number } = {}) : NemModuleWithProviders {
        return {
            nemModule    : TypeormModule,
            providers: [
                { provide: ConnectionProxy, useClass: ConnectionProxy_ },
                { provide: TYPEORM_CONFIG, useValue: config },
                {
                    provide: TYPEORM_CONNECTION_PROMISE,
                    useFactory(config : ConnectionConfig, entities : Function[]|undefined) {
                        return createConnection({
                            ...config,
                            entities
                        })
                    },
                    deps: [ TYPEORM_CONFIG, TYPEORM_ENTITIES ]
                },
                ...(migrations.run ? [{
                    provide: BOOTSTRAP_LISTENER_AFTER,
                    useFactory(connection : ConnectionProxy) {
                        return async () => {
                            await connection.runMigrations()
                        }
                    },
                    deps: [ ConnectionProxy ],
                    multi: true
                }] : migrations.undo ? [{
                    provide: BOOTSTRAP_LISTENER_AFTER,
                    useFactory(connection : ConnectionProxy) {
                        let count = migrations.undo!;
                        return async () => {
                            while(count--) {
                                await connection.undoLastMigration()
                            }
                        }
                    },
                    deps: [ ConnectionProxy ],
                    multi: true
                }] : [])
            ]
        }
    }
}
