import { MikroORM, EntityManager } from 'mikro-orm';
import { PostgreSqlDriver } from 'mikro-orm/dist/drivers/PostgreSqlDriver';
import { BaseEntity } from '../src/entities/BaseEntity';
import { User } from '../src/entities/User';
import { Sport } from '../src/entities/Sport';
import { Specialty } from '../src/entities/Specialty';
import { Site } from '../src/entities/Site';
import { Match } from '../src/entities/Match';
import { IResolvers, makeExecutableSchema } from 'graphql-tools-fork';
import { ApolloServer } from 'apollo-server';
import { join } from 'path';
import { loadFiles } from '@graphql-toolkit/file-loading';
import resolvers from '../src/schema/resolvers';
import { EntityDataLoader } from '../src/schema/datasources/utils';
import {
  UserAPI,
  SiteAPI,
  SportAPI,
  SpecialtyAPI,
  MatchAPI,
} from '../src/schema/datasources';
import { addSampleData } from '../src/db';
import { PostgreSqlConnection } from 'mikro-orm/dist/connections/PostgreSqlConnection';

export async function initORMPostgreSql() {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [BaseEntity, User, Sport, Specialty, Site, Match],
    dbName: 'mikro_orm_test',
    type: 'postgresql' as `postgresql`,
    forceUtcTimezone: true,
    // debug: ['query'],
  });

  await orm.getSchemaGenerator().ensureDatabase();
  const connection = orm.em.getConnection();
  await connection.loadFile(__dirname + '/postgre-schema.sql');

  return orm;
}

export async function wipeDatabasePostgreSql(em: EntityManager) {
  await em.getConnection().execute(`set session_replication_role = 'replica'`);
  await em.createQueryBuilder(User).truncate().execute();
  await em.createQueryBuilder(Sport).truncate().execute();
  await em.createQueryBuilder(Specialty).truncate().execute();
  await em.createQueryBuilder(Site).truncate().execute();
  await em.createQueryBuilder(Match).truncate().execute();
  await em.createQueryBuilder('match_to_user').truncate().execute();
  await em.createQueryBuilder('site_to_sport').truncate().execute();
  await em.getConnection().execute(`set session_replication_role = 'origin'`);
  await addSampleData(em);
  em.clear();
}

export function dropSchema(em: EntityManager) {
  const connection = em.getConnection() as PostgreSqlConnection;
  return connection.loadFile(__dirname + '/postgre-drop-schema.sql');
}

export function createApolloServer(
  orm: MikroORM<PostgreSqlDriver>,
  bypass = true,
) {
  const typeDefs = loadFiles(
    join(__dirname, '../src/schema/typeDefs/**/*.graphql'),
  );

  return new ApolloServer({
    schema: makeExecutableSchema({
      typeDefs,
      resolvers: resolvers as IResolvers,
    }),
    dataSources: () => {
      const em = orm.em.fork();
      const dataloader = new EntityDataLoader(em, bypass);
      return {
        UserAPI: new UserAPI({
          repo: em.getRepository(User),
          dataloader,
        }),
        SiteAPI: new SiteAPI({
          repo: em.getRepository(Site),
          dataloader,
        }),
        SportAPI: new SportAPI({
          repo: em.getRepository(Sport),
          dataloader,
        }),
        SpecialtyAPI: new SpecialtyAPI({
          repo: em.getRepository(Specialty),
          dataloader,
        }),
        MatchAPI: new MatchAPI({
          repo: em.getRepository(Match),
          dataloader,
        }),
      };
    },
  });
}
