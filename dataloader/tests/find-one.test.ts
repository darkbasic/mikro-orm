import {MikroORM, EntityRepository} from 'mikro-orm';
import {PostgreSqlDriver} from 'mikro-orm/dist/drivers/PostgreSqlDriver';
import {initORMPostgreSql, resetDatabase} from './bootstrap';
import {User} from '../src/entities/User';
import {EntityDataLoader} from '../src/schema/datasources/utils';
import {Level} from '../src/entities/Level';
import {Match} from '../src/entities/Match';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Backend', () => {
  jest.setTimeout(10e3);
  let orm: MikroORM<PostgreSqlDriver>;
  let userRepo: EntityRepository<User>;
  let levelRepo: EntityRepository<Level>;
  let matchRepo: EntityRepository<Match>;
  let dataloader: EntityDataLoader;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await resetDatabase(orm);
    userRepo = orm.em.getRepository(User);
    levelRepo = orm.em.getRepository(Level);
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

  it('should retrieve parallel findOne queries with EntityDataLoader', async () => {
    const usersDataloader = await Promise.all(
      [1, 2, 3, 4, 5].map(id => dataloader.findOne(userRepo, {id}))
    );
    expect(usersDataloader).toBeDefined();
    expect(usersDataloader.length).toEqual(5);
    expect(usersDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const users = await Promise.all(
      [1, 2, 3, 4, 5].map(id => userRepo.findOne({id}))
    );
    const usersDataloader = await Promise.all(
      [1, 2, 3, 4, 5].map(id => dataloader.findOne(userRepo, {id}))
    );
    expect(JSON.stringify(users)).toBe(JSON.stringify(usersDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const start = new Date();
    await Promise.all([1, 2, 3, 4, 5].map(id => userRepo.findOne({id})));
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      [1, 2, 3, 4, 5].map(id => dataloader.findOne(userRepo, {id}))
    );
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should retrieve parallel findOne queries with conditions on reference fields with EntityDataLoader', async () => {
    const levelsDataloader = await Promise.all(
      [
        {user: 1, sport: 1},
        {user: 2, sport: 1},
        {user: 3, sport: [1, 2]},
        {user: 1, sport: [999, 1]},
        {user: 2, sport: 2},
        {user: 3, sport: 2},
      ].map(({user, sport}) => dataloader.findOne(levelRepo, {user, sport}))
    );
    expect(levelsDataloader).toBeDefined();
    expect(levelsDataloader.length).toEqual(6);
    expect(levelsDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const conditions = [
      {user: 1, sport: 1},
      {user: 2, sport: 1},
      {user: 3, sport: [1, 2]},
      {user: 1, sport: [999, 1]},
      {user: 2, sport: 2},
      {user: 3, sport: 2},
    ];
    const levels = await Promise.all(
      conditions.map(({user, sport}) => levelRepo.findOne({user, sport}))
    );
    const levelsDataloader = await Promise.all(
      conditions.map(({user, sport}) =>
        dataloader.findOne(levelRepo, {user, sport})
      )
    );
    expect(JSON.stringify(levels)).toBe(JSON.stringify(levelsDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const conditions = [
      {user: 1, sport: 1},
      {user: 2, sport: 1},
      {user: 3, sport: [1, 2]},
      {user: 1, sport: [999, 1]},
      {user: 2, sport: 2},
      {user: 3, sport: 2},
    ];
    const start = new Date();
    await Promise.all(
      conditions.map(({user, sport}) => levelRepo.findOne({user, sport}))
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      conditions.map(({user, sport}) =>
        dataloader.findOne(levelRepo, {user, sport})
      )
    );
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should retrieve parallel findOne queries with conditions on collection fields with EntityDataLoader', async () => {
    const matchesDataloader = await Promise.all(
      [
        {partecipants: [1, 2]},
        {partecipants: [7, 9]},
        {partecipants: 3},
        {partecipants: [8, 999]},
      ].map(({partecipants}) => dataloader.findOne(matchRepo, {partecipants}))
    );
    expect(matchesDataloader).toBeDefined();
    expect(matchesDataloader.length).toEqual(4);
    expect(matchesDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const conditions = [
      {partecipants: [1, 2]},
      {partecipants: [7, 9]},
      {partecipants: 3},
      {partecipants: [8, 999]},
    ];
    const matches = await Promise.all(
      conditions.map(({partecipants}) => matchRepo.findOne({partecipants}))
    );
    const matchsDataloader = await Promise.all(
      conditions.map(({partecipants}) =>
        dataloader.findOne(matchRepo, {partecipants})
      )
    );
    expect(JSON.stringify(matches)).toBe(JSON.stringify(matchsDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const conditions = [
      {partecipants: [1, 2]},
      {partecipants: [7, 9]},
      {partecipants: 3},
      {partecipants: [8, 10]},
    ];
    const start = new Date();
    await Promise.all(
      conditions.map(({partecipants}) => matchRepo.findOne({partecipants}))
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      conditions.map(({partecipants}) =>
        dataloader.findOne(matchRepo, {partecipants})
      )
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
