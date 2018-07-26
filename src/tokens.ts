import { InjectionToken } from '@neoskop/injector';
import { Connection } from 'typeorm';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';
import { SqlServerConnectionOptions } from 'typeorm/driver/sqlserver/SqlServerConnectionOptions';
import { OracleConnectionOptions } from 'typeorm/driver/oracle/OracleConnectionOptions';
import { CordovaConnectionOptions } from 'typeorm/driver/cordova/CordovaConnectionOptions';
import { SqljsConnectionOptions } from 'typeorm/driver/sqljs/SqljsConnectionOptions';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';

export type ConnectionConfig =
    (MysqlConnectionOptions | PostgresConnectionOptions | SqliteConnectionOptions | SqlServerConnectionOptions
        | OracleConnectionOptions | CordovaConnectionOptions | SqljsConnectionOptions | MongoConnectionOptions)
    & { entities? : never };

export const TYPEORM_ENTITIES = new InjectionToken<InstanceType<any>[]>('Typeorm Entities');

export const TYPEORM_CONNECTION_PROMISE = new InjectionToken<Promise<Connection>>('Typeorm Connection Promise');

export const TYPEORM_CONFIG = new InjectionToken<ConnectionConfig>('Typeorm Config');
