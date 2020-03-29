import {IDatabaseDriver, Connection, MikroORM} from 'mikro-orm';
import {User, Sex} from '../entities/User';
import {Sport} from '../entities/Sport';
import {Site} from '../entities/Site';
import {Specialty} from '../entities/Specialty';
import {Match} from '../entities/Match';

async function wipeDatabasePostgreSql(
  orm: MikroORM<IDatabaseDriver<Connection>>,
  wrap = false
) {
  const generator = orm.getSchemaGenerator();

  await generator.dropSchema(wrap);
  await generator.createSchema(wrap);
  orm.em.clear();
}

export async function addSampleData(
  orm: MikroORM<IDatabaseDriver<Connection>>,
  wrap = false
) {
  await wipeDatabasePostgreSql(orm, wrap);
  const {em} = orm;

  const sqlUsers = users.map(
    ({email, name, surname, sex, password}) =>
      new User({
        email,
        name,
        surname,
        sex,
        password,
      })
  );
  for (const user of sqlUsers) {
    await em.persist(user);
  }

  const sqlSports = sports.map(({name}) => new Sport({name}));
  for (const sport of sqlSports) {
    await em.persist(sport);
  }

  const sqlSites = sites.map(
    ({name, position, sportIds}) =>
      new Site({
        name,
        position,
        sports: sportIds.map(sportId => sqlSports[sportId - 1]),
      })
  );
  for (const site of sqlSites) {
    await em.persist(site);
  }

  const sqlSpecialties = specialties.map(
    ({name, males, females, sportId}) =>
      new Specialty({
        name,
        males,
        females,
        sport: sqlSports[sportId - 1],
      })
  );
  for (const specialty of sqlSpecialties) {
    await em.persist(specialty);
  }

  const sqlMatches = matches.map(
    ({date, creatorId, specialtyId, siteId, partecipantIds}) =>
      new Match({
        date,
        creator: sqlUsers[creatorId - 1],
        specialty: sqlSpecialties[specialtyId - 1],
        site: sqlSites[siteId - 1],
        partecipants: partecipantIds.map(userId => sqlUsers[userId - 1]),
      })
  );
  for (const match of sqlMatches) {
    await em.persist(match);
  }

  await em.flush();
}

export type UserDb = {
  id: number;
  createdAt: Date;
  email: string;
  name: string;
  surname: string;
  sex: Sex;
  password: string;
  picture?: string;
};

export type SiteDb = {
  id: number;
  createdAt: Date;
  name: string;
  position: string;
  sportIds: number[];
};

export type SportDb = {
  id: number;
  name: string;
  specialtyIds: number[];
};

export type SpecialtyDb = {
  id: number;
  sportId: number;
  name: string;
  males: number;
  females: number;
};

export type MatchDb = {
  id: number;
  createdAt: Date;
  creatorId: number;
  specialtyId: number;
  partecipantIds: number[];
  siteId: number;
  date: Date;
};

export const users: UserDb[] = [
  {
    id: 1,
    createdAt: new Date(2020, 1, 10, 15, 45),
    email: 'niccolo.belli@linuxsystems.it',
    name: 'Niccolò',
    surname: 'Belli',
    sex: Sex.MALE,
    password: '1111',
  },
  {
    id: 2,
    createdAt: new Date(2020, 1, 11, 10, 10),
    email: 'mario.rossi@linuxsystems.it',
    name: 'Mario',
    surname: 'Rossi',
    sex: Sex.MALE,
    password: '2222',
  },
  {
    id: 3,
    createdAt: new Date(2020, 1, 15, 9, 15),
    email: 'luigi.bianchi@linuxsystems.it',
    name: 'Luigi',
    surname: 'Bianchi',
    sex: Sex.MALE,
    password: '3333',
  },
  {
    id: 4,
    createdAt: new Date(2020, 2, 1, 20, 30),
    email: 'mattia.ferrari@linuxsystems.it',
    name: 'Mattia',
    surname: 'Ferrari',
    sex: Sex.MALE,
    password: '4444',
  },
  {
    id: 5,
    createdAt: new Date(2020, 2, 2, 19, 0),
    email: 'riccardo.russo@linuxsystems.it',
    name: 'Riccardo',
    surname: 'Russo',
    sex: Sex.MALE,
    password: '5555',
  },
  {
    id: 6,
    createdAt: new Date(2020, 2, 5, 16, 20),
    email: 'filippo.magi@linuxsystems.it',
    name: 'Filippo',
    surname: 'Magi',
    sex: Sex.MALE,
    password: '6666',
  },
  {
    id: 7,
    createdAt: new Date(2020, 2, 6, 18, 50),
    email: 'sara.ricci@linuxsystems.it',
    name: 'Sara',
    surname: 'Ricci',
    sex: Sex.FEMALE,
    password: '7777',
  },
  {
    id: 8,
    createdAt: new Date(2020, 2, 6, 21, 30),
    email: 'lucia.fontana@linuxsystems.it',
    name: 'Lucia',
    surname: 'Fontana',
    sex: Sex.FEMALE,
    password: '8888',
  },
  {
    id: 9,
    createdAt: new Date(2020, 2, 6, 22, 50),
    email: 'giorgia.esposito@linuxsystems.it',
    name: 'Giorgia',
    surname: 'Esposito',
    sex: Sex.FEMALE,
    password: '9999',
  },
  {
    id: 10,
    createdAt: new Date(2020, 2, 7, 8, 30),
    email: 'claudia.recanatini@linuxsystems.it',
    name: 'Claudia',
    surname: 'Recanatini',
    sex: Sex.FEMALE,
    password: '0000',
  },
];

export const sites: SiteDb[] = [
  {
    id: 1,
    createdAt: new Date(2020, 1, 5, 8, 15),
    name: 'The Beach',
    position: 'Falconara Marittima',
    sportIds: [1, 2],
  },
  {
    id: 2,
    createdAt: new Date(2020, 1, 5, 8, 15),
    name: 'Palabeach',
    position: 'Ancona',
    sportIds: [1, 2],
  },
];

export const sports: SportDb[] = [
  {
    id: 1,
    name: 'Beach Volley',
    specialtyIds: [1, 2, 3],
  },
  {
    id: 2,
    name: 'Beach Tennis',
    specialtyIds: [4, 5, 6, 7, 8],
  },
];

export const specialties: SpecialtyDb[] = [
  {
    id: 1,
    sportId: 1,
    name: '2x2 Male',
    males: 4,
    females: 0,
  },
  {
    id: 2,
    sportId: 1,
    name: '2x2 Female',
    males: 0,
    females: 4,
  },
  {
    id: 3,
    sportId: 1,
    name: '2x2 Mixed',
    males: 2,
    females: 2,
  },
  {
    id: 4,
    sportId: 2,
    name: '1x1 Male',
    males: 2,
    females: 0,
  },
  {
    id: 5,
    sportId: 2,
    name: '1x1 Female',
    males: 0,
    females: 2,
  },
  {
    id: 6,
    sportId: 2,
    name: '2x2 Male',
    males: 4,
    females: 0,
  },
  {
    id: 7,
    sportId: 2,
    name: '2x2 Female',
    males: 0,
    females: 4,
  },
  {
    id: 8,
    sportId: 2,
    name: '2x2 Mixed',
    males: 2,
    females: 2,
  },
];

export const matches: MatchDb[] = [
  {
    id: 1,
    createdAt: new Date(2020, 2, 12, 8, 5),
    creatorId: 1,
    specialtyId: 1,
    partecipantIds: [1, 2, 4, 6],
    siteId: 1,
    date: new Date(2020, 2, 12, 19, 0),
  },
  {
    id: 2,
    createdAt: new Date(2020, 2, 13, 15, 45),
    creatorId: 1,
    specialtyId: 3,
    partecipantIds: [1, 4, 7, 9],
    siteId: 1,
    date: new Date(2020, 4, 20, 18, 30),
  },
];
