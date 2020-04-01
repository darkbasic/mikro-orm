import {MikroORM, EntityRepository} from 'mikro-orm';
import {PostgreSqlDriver} from 'mikro-orm/dist/drivers/PostgreSqlDriver';
import {initORMPostgreSql, resetDatabase} from './bootstrap';
import {EntityDataLoader} from '../src/schema/datasources/utils';
import {Match} from '../src/entities/Match';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Backend', () => {
  jest.setTimeout(10e3);
  let orm: MikroORM<PostgreSqlDriver>;
  let matchRepo: EntityRepository<Match>;
  let dataloader: EntityDataLoader;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await resetDatabase(orm);
    matchRepo = orm.em.getRepository(Match);
    dataloader = new EntityDataLoader(orm.em);
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

  it('should retrieve parallel references with EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const creatorsDataloader = await Promise.all(
      matches.map(({creator}) => dataloader.load(creator))
    );
    expect(creatorsDataloader).toBeDefined();
    expect(creatorsDataloader.length).toEqual(5);
    expect(creatorsDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const creators = await Promise.all(
      matches.map(({creator}) => creator.load())
    );
    const creatorsDataloader = await Promise.all(
      matches.map(({creator}) => dataloader.load(creator))
    );
    expect(JSON.stringify(creators)).toBe(JSON.stringify(creatorsDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const start = new Date();
    await Promise.all(matches.map(({creator}) => creator.load()));
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(matches.map(({creator}) => dataloader.load(creator)));
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
