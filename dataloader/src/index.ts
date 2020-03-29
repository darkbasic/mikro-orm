import {ApolloServer} from 'apollo-server';
import {join} from 'path';
import {loadFiles} from '@graphql-toolkit/file-loading';
import {IResolvers, makeExecutableSchema} from 'graphql-tools-fork';
import resolvers from './schema/resolvers';
import {MikroORM} from 'mikro-orm';
import config from './mikro-orm.config';
import {addSampleData} from './db';
import {
  UserAPI,
  SiteAPI,
  SportAPI,
  SpecialtyAPI,
  MatchAPI,
} from './schema/datasources';
import {EntityDataLoader} from './schema/datasources/utils';
import {User} from './entities/User';
import {Site} from './entities/Site';
import {Sport} from './entities/Sport';
import {Specialty} from './entities/Specialty';
import {Match} from './entities/Match';

export interface ApolloContext {
  userId: number;
}

export interface MyContext extends ApolloContext {
  dataSources: {
    UserAPI: UserAPI;
    SiteAPI: SiteAPI;
    SportAPI: SportAPI;
    SpecialtyAPI: SpecialtyAPI;
    MatchAPI: MatchAPI;
  };
}

(async () => {
  const orm = await MikroORM.init(config);

  if (process.argv.includes('--add-sample-data')) {
    console.log('Adding sample data...');
    await addSampleData(orm);
  }

  const typeDefs = loadFiles(join(__dirname, 'schema/typeDefs/**/*.graphql'));
  const server = new ApolloServer({
    schema: makeExecutableSchema({
      typeDefs,
      resolvers: resolvers as IResolvers,
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ({req}): ApolloContext => ({
      userId: 1,
    }),
    dataSources: () => {
      const em = orm.em.fork();
      const dataloader = new EntityDataLoader(em);
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
  const {url} = await server.listen();
  console.log(`Server ready at ${url}`);
})();
