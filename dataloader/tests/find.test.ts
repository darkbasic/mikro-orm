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

  it('should retrieve parallel find queries with EntityDataLoader', async () => {
    const levelsDataloader = await Promise.all(
      [1, 3, 4, 5, 999].map(declaredLevel =>
        dataloader.find(levelRepo, {declaredLevel})
      )
    );
    expect(levelsDataloader).toBeDefined();
    expect(levelsDataloader.length).toEqual(5);
    expect(levelsDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const conditions = [1, 3, 4, 5, 999];
    const levels = await Promise.all(
      conditions.map(declaredLevel => levelRepo.find({declaredLevel}))
    );
    const levelsDataloader = await Promise.all(
      conditions.map(declaredLevel =>
        dataloader.find(levelRepo, {declaredLevel})
      )
    );
    expect(JSON.stringify(levels)).toBe(JSON.stringify(levelsDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const conditions = [1, 3, 4, 5, 999];
    const start = new Date();
    await Promise.all(
      conditions.map(declaredLevel => levelRepo.find({declaredLevel}))
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      conditions.map(declaredLevel =>
        dataloader.find(levelRepo, {declaredLevel})
      )
    );
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should retrieve parallel find queries with conditions on reference fields with EntityDataLoader', async () => {
    const matchesDataloader = await Promise.all(
      [
        {specialty: 1, site: 1},
        {specialty: 1, site: 2},
        {specialty: 1, site: [1, 2]},
        {specialty: [1, 2], site: [1, 2]},
        {specialty: [3], site: 1},
        {specialty: [1, 2, 3], site: [1, 999]},
      ].map(({specialty, site}) =>
        dataloader.find(matchRepo, {specialty, site})
      )
    );
    expect(matchesDataloader).toBeDefined();
    expect(matchesDataloader.length).toEqual(6);
    expect(matchesDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const conditions = [
      {specialty: 1, site: 1},
      {specialty: 1, site: 2},
      {specialty: 1, site: [1, 2]},
      {specialty: [1, 2], site: [1, 2]},
      {specialty: [3], site: 1},
      {specialty: [1, 2, 3], site: [1, 999]},
    ];
    const matches = await Promise.all(
      conditions.map(({specialty, site}) => matchRepo.find({specialty, site}))
    );
    const matchesDataloader = await Promise.all(
      conditions.map(({specialty, site}) =>
        dataloader.find(matchRepo, {specialty, site})
      )
    );
    expect(JSON.stringify(matches)).toBe(JSON.stringify(matchesDataloader));
  });

  it('should be faster with EntityDataLoader', async () => {
    const conditions = [
      {specialty: 1, site: 1},
      {specialty: 1, site: 2},
      {specialty: 1, site: [1, 2]},
      {specialty: [1, 2], site: [1, 2]},
      {specialty: [3], site: 1},
      {specialty: [1, 2, 3], site: [1, 999]},
    ];
    const start = new Date();
    await Promise.all(
      conditions.map(({specialty, site}) => matchRepo.find({specialty, site}))
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      conditions.map(({specialty, site}) =>
        dataloader.find(matchRepo, {specialty, site})
      )
    );
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThan(diff);
  });

  it('should retrieve parallel find queries with conditions on collection fields with EntityDataLoader', async () => {
    const partecipantsDataloader = await Promise.all(
      [1, 2, 3, 4, 5].map(partecipatedMatches =>
        dataloader.find(userRepo, {partecipatedMatches})
      )
    );
    expect(partecipantsDataloader).toBeDefined();
    expect(partecipantsDataloader.length).toEqual(5);
    expect(partecipantsDataloader).toMatchSnapshot();
  });

  it('should return the same entities without EntityDataLoader', async () => {
    const partecipants = await Promise.all(
      [1, 2, 3, 4, 5].map(partecipatedMatches =>
        userRepo.find({partecipatedMatches})
      )
    );
    const partecipantsDataloader = await Promise.all(
      [1, 2, 3, 4, 5].map(partecipatedMatches =>
        dataloader.find(userRepo, {partecipatedMatches})
      )
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
    const start = new Date();
    await Promise.all(
      [1, 2, 3, 4, 5].map(partecipatedMatches =>
        userRepo.find({partecipatedMatches})
      )
    );
    const end = new Date();
    const diff = end.getTime() - start.getTime();
    const startDataloader = new Date();
    await Promise.all(
      [1, 2, 3, 4, 5].map(partecipatedMatches =>
        dataloader.find(userRepo, {partecipatedMatches})
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
