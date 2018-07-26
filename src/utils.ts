import { Brackets, QueryBuilder, SelectQueryBuilder, WhereExpression } from 'typeorm';
import { OrderByCondition } from 'typeorm/find-options/OrderByCondition';

export function createTypeormOrderByCondition(order?: string[], alias?: string) : OrderByCondition {
    const o : OrderByCondition = {};
    if(order) {
        for(const oo of order) {
            const parts = oo.split(/:/);
            if(1 === parts.length) {
                o[(alias ? `${alias}.`: '') + parts[0].replace(/[^a-z_]/, '')] = 'ASC';
            } else if(2 === parts.length) {
                o[(alias ? `${alias}.`: '') + parts[0].replace(/[^a-z_]/, '')] = parts[1].toLowerCase() === 'reverse' ? 'DESC' : 'ASC';
            } else {
                throw new Error(`Invalid order "${oo}"`);
            }
        }
    }
    return o;
}

export type Eq = { eq: Value };
export type Gt = { gt: Value };
export type Gte = { gte: Value };
export type Lt = { lt: Value };
export type Lte = { lte: Value };
export type Between = { between: [ Value, Value ] };
export type Null = { null: boolean };
export type In = { in: Value[] };
export type Like = { like: string };
export type Not = { not: Expression };
export type And = { and: ExpressionObject[] };
export type Or = { or: ExpressionObject[] };

export type Value = string|number|boolean
export type Expression = Eq | Gt | Gte | Lt | Lte | Between | Null | In | Like | Not;
export type ExpressionMap = { [field: string]: Expression };
export type ExpressionObject = ExpressionMap | And | Or;

export function createTypeormWhereCondition(obj : ExpressionObject, alias?: string) : (qb : SelectQueryBuilder<any>) => any {
    return (qb : SelectQueryBuilder<any>) => {
        if((obj as And).and !== undefined) {
            andExp(qb, (obj as And).and, alias);
        } else if((obj as Or).or !== undefined) {
            orExp(qb, (obj as Or).or, alias);
        } else {
            andExp(qb, [ obj ], alias);
        }
    }
}

function expression(qb : QueryBuilder<any>, field : string, e : Expression, alias?: string) : [ string, object|undefined ] {
    const [ key ] = Object.keys(e);
    if(key === 'eq') {
        return eq(qb, field, e as Eq, alias);
    }
    if(key === 'not') {
        return not(qb, field, e as Not, alias);
    }
    if(key === 'gt') {
        return gt(qb, field, e as Gt, alias);
    }
    if(key === 'gte') {
        return gte(qb, field, e as Gte, alias);
    }
    if(key === 'lt') {
        return lt(qb, field, e as Lt, alias);
    }
    if(key === 'lte') {
        return lte(qb, field, e as Lte, alias);
    }
    if(key === 'between') {
        return between(qb, field, e as Between, alias);
    }
    if(key === 'null') {
        return _null(qb, field, e as Null, alias);
    }
    if(key === 'in') {
        return _in(qb, field, e as In, alias);
    }
    if(key === 'like') {
        return like(qb, field, e as Like, alias);
    }
    throw new Error(`Not supported: ${JSON.stringify(e)}`);
}

function eq(qb : QueryBuilder<any>, field : string, e : Eq, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' = :' + name, { [name]: e.eq } ];
}

function not(qb : QueryBuilder<any>, field : string, e : Not, alias? : string) : [ string, object|undefined ] {
    const [ q, params ] = expression(qb, field, e.not, alias);
    return [ 'NOT ' + q, params ];
}

function gt(qb : QueryBuilder<any>, field : string, e : Gt, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' > :' + name, { [name]: e.gt } ];
}

function gte(qb : QueryBuilder<any>, field : string, e : Gte, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' >= :' + name, { [name]: e.gte } ];
}

function lt(qb : QueryBuilder<any>, field : string, e : Lt, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' < :' + name, { [name]: e.lt } ];
}

function lte(qb : QueryBuilder<any>, field : string, e : Lte, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' <= :' + name, { [name]: e.lte } ];
}

function between(qb : QueryBuilder<any>, field : string, e : Between, alias? : string) : [ string, object ] {
    const lower = uniqueParamName(qb);
    const upper = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' BETWEEN :' + lower + ' AND :' + upper, { [lower]: e.between[0], [upper]: e.between[1] } ];
}

function _null(qb : QueryBuilder<any>, field : string, e : Null, alias? : string) : [ string, undefined ] {
    return [ escapeField(qb, field, alias) + ' IS ' + (e.null ? 'NULL' : 'NOT NULL'), undefined ];
}

function _in(qb : QueryBuilder<any>, field : string, e : In, alias? : string) : [ string, object ] {
    const names = e.in.map(() => uniqueParamName(qb));
    const params : any = {};
    for(let i = 0, l = names.length; i < l; ++i) {
        params[names[i]] = e.in[i];
    }
    return [ escapeField(qb, field, alias) + ' IN (:' + names.join(',:') + ')', params ];
}

function like(qb : QueryBuilder<any>, field : string, e : Like, alias? : string) : [ string, object ] {
    const name = uniqueParamName(qb);
    return [ escapeField(qb, field, alias) + ' LIKE :' + name, { [name]: e.like } ];
}

function andExp(qb : SelectQueryBuilder<any>, exps : ExpressionObject[], alias?: string, where : WhereExpression = qb, m : 'andWhere' | 'orWhere' = 'andWhere') : void {
    where[m](new Brackets((wqb : WhereExpression) => {
        for(const exp of exps) {
            const keys = Object.keys(exp);

            if(keys.length === 1) {
                if((exp as And).and) {
                    andExp(qb, (exp as And).and, alias, wqb, 'andWhere');
                    continue;
                } else if((exp as Or).or) {
                    orExp(qb, (exp as Or).or, alias, wqb, 'andWhere');
                    continue;
                }
            }

            wqb.andWhere(new Brackets((wqb : WhereExpression) => {
                for(const key of keys) {
                    const [ q, params ] = expression(qb, key, (exp as ExpressionMap)[ key ], alias);
                    wqb.andWhere(q, params);
                }
            }));

        }
    }));
}

function orExp(qb : SelectQueryBuilder<any>, exps : ExpressionObject[], alias?: string, where : WhereExpression = qb, m : 'andWhere' | 'orWhere' = 'andWhere') {
    where[m](new Brackets((wqb : WhereExpression) => {
        for(const exp of exps) {
            const keys = Object.keys(exp);

            if(keys.length === 1) {
                if((exp as And).and) {
                    andExp(qb, (exp as And).and, alias, wqb, 'orWhere');
                    continue;
                } else if((exp as Or).or) {
                    orExp(qb, (exp as Or).or, alias, wqb, 'orWhere');
                    continue;
                }
            }

            wqb.orWhere(new Brackets((wqb : WhereExpression) => {
                for(const key of keys) {
                    const [ q, params ] = expression(qb, key, (exp as ExpressionMap)[key], alias);
                    wqb.andWhere(q, params);
                }
            }));

        }
    }))
}

function escapeField(qb : QueryBuilder<any>, name : string, alias?: string) {
    name = name.replace(/[^a-zA-Z_]/, '');
    return alias ? `${qb.escape(alias)}.${qb.escape(name)}` : qb.escape(name);
}

const MAP = new WeakMap<QueryBuilder<any>, number>();
function uniqueParamName(qb : QueryBuilder<any>) {
    if(!MAP.has(qb)) {
        MAP.set(qb, 0);
    } else {
        MAP.set(qb, MAP.get(qb)! + 1);
    }

    return 'param_' + MAP.get(qb);
}



