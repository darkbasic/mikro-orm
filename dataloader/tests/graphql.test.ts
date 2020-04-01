import {MikroORM} from 'mikro-orm';
import {PostgreSqlDriver} from 'mikro-orm/dist/drivers/PostgreSqlDriver';
import {
  initORMPostgreSql,
  createApolloServer,
  resetDatabase,
} from './bootstrap';
import {ApolloServer, gql} from 'apollo-server';
import {createTestClient} from 'apollo-server-testing';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Backend', () => {
  jest.setTimeout(10e3);
  let orm: MikroORM<PostgreSqlDriver>;
  let server: ApolloServer;

  const getSportsQuery = gql`
    {
      sports {
        id
        name
        specialties {
          id
          name
        }
      }
    }
  `;

  const getSpecialtiesQuery = gql`
    {
      specialties {
        id
        name
        sport {
          id
          name
        }
      }
    }
  `;

  const bigQuery = gql`
    {
      specialties {
        id
        name
        sport {
          id
          name
          sites {
            id
            name
            sports {
              id
              name
            }
            matches {
              id
              date
            }
          }
          specialties {
            id
            name
          }
        }
        matches {
          id
          date
          specialty {
            id
            name
          }
          site {
            id
            name
          }
          partecipants {
            id
            name
            createdMatches {
              id
              date
            }
            partecipatedMatches {
              id
              date
            }
          }
        }
      }
    }
  `;

  const findQuery = gql`
    {
      matches(sportId: 1) {
        id
        averageLevel
      }
    }
  `;

  const findOneQuery = gql`
    {
      matches(sportId: 1) {
        id
        partecipants {
          id
          name
          level(sportId: 1)
        }
      }
    }
  `;

  const findAndFindOneQuery = gql`
    {
      matches(sportId: 1) {
        id
        averageLevel
        partecipants {
          id
          name
          level(sportId: 1)
        }
      }
    }
  `;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await resetDatabase(orm);
  });
  beforeEach(async () => {
    orm.em.clear();
    await sleep(100);
  });

  test('isConnected()', async () => {
    await expect(orm.isConnected()).resolves.toBe(true);
    await orm.close(true);
    await expect(orm.isConnected()).resolves.toBe(false);
    await orm.connect();
    await expect(orm.isConnected()).resolves.toBe(true);
  });

  it('should fetch all users', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({
      query: gql`
        {
          users {
            id
            name
          }
        }
      `,
    });
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should fetch all sports and their specialties (One To Many)', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: getSportsQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: getSportsQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: getSportsQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: getSportsQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: getSportsQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should fetch all specialties and their sport (Many To One)', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: getSpecialtiesQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: getSpecialtiesQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: getSpecialtiesQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: getSpecialtiesQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: getSpecialtiesQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should fetch a BIG query', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: bigQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: bigQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: bigQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: bigQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: bigQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should fetch a query with find() in the resolvers', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: findQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: findQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: findQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: findQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: findQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should fetch a query with findOne() in the resolvers', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: findOneQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: findOneQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: findOneQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: findOneQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: findOneQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should fetch a query with find() and findOne() in the resolvers', async () => {
    server = createApolloServer(orm);
    const {query} = createTestClient(server);
    const res = await query({query: findAndFindOneQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(res.data).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const res = await query({query: findAndFindOneQuery});
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const resDataloader = await query({query: findAndFindOneQuery});
    expect(res.data).toBeDefined();
    expect(res.errors).toBeUndefined();
    expect(resDataloader.data).toBeDefined();
    expect(resDataloader.errors).toBeUndefined();
    expect(JSON.stringify(resDataloader.data)).toBe(JSON.stringify(res.data));
  });

  it('should be faster with EntityDataLoader', async () => {
    server = createApolloServer(orm);
    let {query} = createTestClient(server);
    const start = new Date();
    await query({query: findAndFindOneQuery});
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    server = createApolloServer(orm, false);
    query = createTestClient(server).query;
    const startDataloader = new Date();
    await query({query: findAndFindOneQuery});
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  afterAll(async () => {
    orm.close(true);
    await sleep(100);
  });
});
