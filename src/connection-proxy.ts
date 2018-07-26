import { QueryRunner } from 'typeorm/query-runner/QueryRunner';
import {
    Connection,
    ConnectionOptions,
    Driver,
    EntityManager,
    Logger, MigrationInterface,
    MongoEntityManager,
    MongoRepository, ObjectType, Repository, SelectQueryBuilder, TreeRepository
} from 'typeorm';
import { Inject, Injectable } from '@neoskop/injector';
import { TYPEORM_CONNECTION_PROMISE } from './tokens';
import { EntityMetadata } from 'typeorm/metadata/EntityMetadata';

@Injectable()
export abstract class ConnectionProxy {
    abstract readonly name : Promise<string>;
    abstract readonly options : Promise<ConnectionOptions>;
    abstract readonly driver : Promise<Driver>;
    abstract readonly manager : Promise<EntityManager>;
    abstract readonly mongoManager : Promise<MongoEntityManager>;
    abstract readonly logger : Promise<Logger>;
    abstract readonly migrations : Promise<MigrationInterface[]>

    /**
     * Checks if entity metadata exist for the given entity class, target name or table name.
     */
    abstract hasMetadata(target: Function | string): Promise<boolean>;
    /**
     * Gets entity metadata for the given entity class or schema name.
     */
    abstract getMetadata(target: Function | string): Promise<EntityMetadata>;
    /**
     * Gets repository for the given entity.
     */
    abstract getRepository<Entity>(target: ObjectType<Entity> | string): Promise<Repository<Entity>>;
    /**
     * Gets tree repository for the given entity class or name.
     * Only tree-type entities can have a TreeRepository, like ones decorated with @ClosureEntity decorator.
     */
    abstract getTreeRepository<Entity>(target: ObjectType<Entity> | string): Promise<TreeRepository<Entity>>;
    /**
     * Gets mongodb-specific repository for the given entity class or name.
     * Works only if connection is mongodb-specific.
     */
    abstract getMongoRepository<Entity>(target: ObjectType<Entity> | string): Promise<MongoRepository<Entity>>;
    /**
     abstract * Wraps given function execution (and all operations made there) into a transaction.
     * All database operations must be executed using provided entity manager.
     */
    abstract transaction(runInTransaction: (entityManger: EntityManager) => Promise<any>): Promise<any>;
    /**
     * Executes raw SQL query and returns raw database results.
     */
    abstract query(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<any>;
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    abstract createQueryBuilder<Entity>(entityClass: ObjectType<Entity> | Function | string, alias: string, queryRunner?: QueryRunner): Promise<SelectQueryBuilder<Entity>>;
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    abstract createQueryBuilder(queryRunner?: QueryRunner): Promise<SelectQueryBuilder<any>>;
    /**
     * Runs all pending migrations.
     * Can be used only after connection to the database is established.
     */
    abstract runMigrations(options?: {
        transaction?: boolean;
    }): Promise<void>;
    /**
     * Reverts last executed migration.
     * Can be used only after connection to the database is established.
     */
    abstract undoLastMigration(options?: {
        transaction?: boolean;
    }): Promise<void>;
}

@Injectable()
export class ConnectionProxy_ extends ConnectionProxy {
    get name() : Promise<string> {
        return this.connection.then(connection => connection.name);
    }
    get options() : Promise<ConnectionOptions> {
        return this.connection.then(connection => connection.options);
    }
    get driver() : Promise<Driver> {
        return this.connection.then(connection => connection.driver);
    }
    get manager() : Promise<EntityManager> {
        return this.connection.then(connection => connection.manager);
    }
    get mongoManager() : Promise<MongoEntityManager> {
        return this.connection.then(connection => connection.mongoManager);
    }
    get logger() : Promise<Logger> {
        return this.connection.then(connection => connection.logger);
    }
    get migrations() : Promise<MigrationInterface[]> {
        return this.connection.then(connection => connection.migrations);
    }

    constructor(@Inject(TYPEORM_CONNECTION_PROMISE) protected readonly connection : Promise<Connection>) {
        super();
    }

    hasMetadata(target : Function | string) : Promise<boolean> {
        return this.connection.then(connection => connection.hasMetadata(target));
    }

    getMetadata(target : Function | string) : Promise<EntityMetadata> {
        return this.connection.then(connection => connection.getMetadata(target));
    }

    getRepository<Entity>(target : ObjectType<Entity> | string) : Promise<Repository<Entity>> {
        return this.connection.then(connection => connection.getRepository(target));
    }

    getTreeRepository<Entity>(target : ObjectType<Entity> | string) : Promise<TreeRepository<Entity>> {
        return this.connection.then(connection => connection.getTreeRepository(target));
    }

    getMongoRepository<Entity>(target : ObjectType<Entity> | string) : Promise<MongoRepository<Entity>> {
        return this.connection.then(connection => connection.getMongoRepository(target));
    }

    transaction(runInTransaction : (entityManger : EntityManager) => Promise<any>) : Promise<any> {
        return this.connection.then(connection => connection.transaction(runInTransaction));
    }

    query(query : string, parameters? : any[], queryRunner? : QueryRunner) : Promise<any> {
        return this.connection.then(connection => connection.query(query, parameters, queryRunner));
    }

    createQueryBuilder<Entity>(entityClass: ObjectType<Entity> | Function | string, alias: string, queryRunner?: QueryRunner): Promise<SelectQueryBuilder<Entity>>;
    createQueryBuilder(queryRunner? : QueryRunner) : Promise<SelectQueryBuilder<any>>;
    createQueryBuilder<Entity = any>(entityClassOrQueryRunner? : ObjectType<Entity> | Function | string | QueryRunner, alias?: string, queryRunner?: QueryRunner) {
        return this.connection.then(connection => connection.createQueryBuilder(entityClassOrQueryRunner as any, alias!, queryRunner));
    }

    async runMigrations(options?: {
        transaction?: boolean;
    }): Promise<void> {
        await (await this.connection).runMigrations(options);
    }

    async undoLastMigration(options?: {
        transaction?: boolean;
    }): Promise<void> {
        await (await this.connection).undoLastMigration(options);
    }
}
