import {MikroORM} from 'mikro-orm';
import {PostgreSqlDriver} from 'mikro-orm/dist/drivers/PostgreSqlDriver';
import {BaseEntity} from '../src/entities/BaseEntity';
import {User} from '../src/entities/User';
import {Sport} from '../src/entities/Sport';
import {Specialty} from '../src/entities/Specialty';
import {Site} from '../src/entities/Site';
import {Match} from '../src/entities/Match';
import {IResolvers, makeExecutableSchema} from 'graphql-tools-fork';
import {ApolloServer} from 'apollo-server';
import {join} from 'path';
import {loadFiles} from '@graphql-toolkit/file-loading';
import resolvers from '../src/schema/resolvers';
import {EntityDataLoader} from '../src/schema/datasources/utils';
import {
  UserAPI,
  SiteAPI,
  SportAPI,
  SpecialtyAPI,
  MatchAPI,
} from '../src/schema/datasources';
import {addSampleData} from '../src/db';

export async function initORMPostgreSql() {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: [BaseEntity, User, Sport, Specialty, Site, Match],
    dbName: 'mikro_orm_test',
    type: 'postgresql' as `postgresql`,
    forceUtcTimezone: true,
    //debug: ['query'],
  });

  const generator = orm.getSchemaGenerator();
  await generator.ensureDatabase();

  return orm;
}

export async function resetDatabase(orm: MikroORM<PostgreSqlDriver>) {
  await addSampleData(orm, true);
}

export function createApolloServer(
  orm: MikroORM<PostgreSqlDriver>,
  bypass = true
) {
  const typeDefs = loadFiles(
    join(__dirname, '../src/schema/typeDefs/**/*.graphql')
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
