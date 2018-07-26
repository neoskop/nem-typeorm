import 'mocha';
import { expect } from 'chai';
import { SelectQueryBuilder } from 'typeorm';
import { createTypeormWhereCondition } from './utils';

const mockConnection : any = {
    hasMetadata() {
        return false
    },
    driver: {
        escape(str : string) {
            return '`' + str + '`';
        }
    }
};

describe('utils', () => {
    describe('createTypeormWhereCondition', () => {
        let qb : SelectQueryBuilder<any>;
        beforeEach(() => {
            qb = new SelectQueryBuilder<any>(mockConnection);
            qb.from('table', 't');
        });
        
        it('should build single eq expression', () => {
            createTypeormWhereCondition({ field: { eq: 'Foobar' } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` = :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foobar'
            })
        });
        
        it('should build multiple eq expression', () => {
            createTypeormWhereCondition({
                field: { eq: 'Foobar' },
                foo  : { eq: 'baz' }
            }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` = :param_0 AND `t`.`foo` = :param_1))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foobar',
                param_1: 'baz'
            })
        });
        
        it('should build negated eq expression', () => {
            createTypeormWhereCondition({ field: { not: { eq: 'Foobar' } } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((NOT `t`.`field` = :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foobar'
            })
        });
        
        it('should build gt expression', () => {
            createTypeormWhereCondition({ field: { gt: 1 } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` > :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1
            })
        });
        
        it('should build gte expression', () => {
            createTypeormWhereCondition({ field: { gte: 1 } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` >= :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1
            })
        });
        
        it('should build lt expression', () => {
            createTypeormWhereCondition({ field: { lt: 1 } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` < :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1
            })
        });
        
        it('should build lte expression', () => {
            createTypeormWhereCondition({ field: { lte: 1 } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` <= :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1
            })
        });
        
        it('should build between expression', () => {
            createTypeormWhereCondition({ field: { between: [ 1, 5 ] } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` BETWEEN :param_0 AND :param_1))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1,
                param_1: 5
            })
        });
        
        it('should build null expression', () => {
            createTypeormWhereCondition({ field: { null: true } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` IS NULL))');
            expect(qb.getParameters()).to.be.eql({})
        });
        
        it('should build negated null expression', () => {
            createTypeormWhereCondition({ field: { null: false } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` IS NOT NULL))');
            expect(qb.getParameters()).to.be.eql({})
        });
        
        it('should build in expression', () => {
            createTypeormWhereCondition({ field: { in: [ 1, 3, 5 ] } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` IN (:param_0,:param_1,:param_2)))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 1,
                param_1: 3,
                param_2: 5,
            })
        });
        
        it('should build like expression', () => {
            createTypeormWhereCondition({ field: { like: 'Foo%' } }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` LIKE :param_0))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foo%'
            })
        });
        
        it('should build nested and', () => {
            createTypeormWhereCondition({
                and: [
                    { field: { like: 'Foo%' } },
                    { field: { not: { like: '%bar' } } }
                ]
            }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` LIKE :param_0) AND (NOT `t`.`field` LIKE :param_1))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foo%',
                param_1: '%bar'
            })
        });
        
        it('should build nested or', () => {
            createTypeormWhereCondition({
                or: [
                    { field: { like: 'Foo%' } },
                    { field: { not: { like: '%bar' } } }
                ]
            }, 't')(qb);
            
            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` LIKE :param_0) OR (NOT `t`.`field` LIKE :param_1))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foo%',
                param_1: '%bar'
            })
        });
        
        it('should build nasty nested conditions', () => {
            createTypeormWhereCondition({
                or: [
                    { field: { like: 'Foo%' } },
                    {
                        and: [
                            { field_two: { eq: 'baz' } },
                            {
                                or: [
                                    { field_three: { eq: 'baz' } },
                                    { field_four: { eq: 'baz' } }
                                ]
                            }
                        ]
                    }
                ]
            }, 't')(qb);

            expect(qb.getQuery()).to.be.equal('SELECT * FROM `table` `t` WHERE ((`t`.`field` LIKE :param_0) OR ((`t`.`field_two` = :param_1) AND ((`t`.`field_three` = :param_2) OR (`t`.`field_four` = :param_3))))');
            expect(qb.getParameters()).to.be.eql({
                param_0: 'Foo%',
                param_1: 'baz',
                param_2: 'baz',
                param_3: 'baz'
            })
        })
    })
});
