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

  it('should retrieve parallel collections with EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const partecipantsDataloader = await Promise.all(
      matches.map(({partecipants}) => dataloader.load(partecipants))
    );
    expect(partecipantsDataloader).toBeDefined();
    expect(partecipantsDataloader.length).toEqual(5);
    expect(partecipantsDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const partecipants = await Promise.all(
      matches.map(({partecipants}) => partecipants.loadItems())
    );
    const partecipantsDataloader = await Promise.all(
      matches.map(({partecipants}) => dataloader.load(partecipants))
    );
    expect(
      JSON.stringify(
        partecipants.map(users => users.sort((a, b) => a.id - b.id))
      )
    ).toBe(
      JSON.stringify(
        partecipantsDataloader.map(users => users.sort((a, b) => a.id - b.id))
      )
    );
  });

  it('should be faster with EntityDataLoader', async () => {
    const matches = await matchRepo.find({id: {$lte: 5}});
    const start = new Date();
    await Promise.all(
      matches.map(({partecipants}) => partecipants.loadItems())
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      matches.map(({partecipants}) => dataloader.load(partecipants))
    );
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
