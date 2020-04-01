import {ensureIsNum, getItemNoPopulate} from './utils';
import {GraphQLResolveInfo} from 'graphql';
import {OrmAPI} from './OrmAPI';
import {Match} from '../../entities/Match';
import {User} from '../../entities/User';
import {Specialty} from '../../entities/Specialty';
import {Site} from '../../entities/Site';
import {Level} from '../../entities/Level';

export class MatchAPI extends OrmAPI<Match> {
  getMatches(
    sportId?: number | string | null,
    specialtyIds?: number[] | string[] | null
  ): Promise<Match[]> {
    return this.repo.find({
      ...(specialtyIds?.length && {
        specialty: ensureIsNum(specialtyIds),
      }),
      ...(sportId &&
        !specialtyIds?.length && {
          specialty: {
            sport: ensureIsNum(sportId),
          },
        }),
    });
  }

  getMatchCreator(
    {creator}: Match,
    info?: GraphQLResolveInfo
  ): Promise<User> | User {
    return getItemNoPopulate(creator, info) || this.dataloader.load(creator);
  }

  getMatchSpecialty(
    {specialty}: Match,
    info?: GraphQLResolveInfo
  ): Promise<Specialty> | Specialty {
    return (
      getItemNoPopulate(specialty, info) || this.dataloader.load(specialty)
    );
  }

  async getMatchPartecipants({partecipants}: Match): Promise<User[]> {
    return (await this.dataloader.load(partecipants)).sort(
      (a, b) => a.id - b.id
    );
  }

  getMatchSite({site}: Match, info?: GraphQLResolveInfo): Promise<Site> | Site {
    return getItemNoPopulate(site, info) || this.dataloader.load(site);
  }

  async getMatchAverageLevel(match: Match): Promise<number | null> {
    const [partecipants, specialty] = await Promise.all([
      this.getMatchPartecipants(match),
      this.getMatchSpecialty(match),
    ]);
    if (!partecipants.length) {
      return null;
    }

    const partecipantIds = partecipants.map(partecipant => partecipant.id);
    const sportId = specialty.sport.id;

    const levels = await this.dataloader.find(this.em.getRepository(Level), {
      user: partecipantIds,
      sport: sportId,
    });

    return levels.length
      ? levels.reduce((acc, cur) => acc + cur.declaredLevel, 0) / levels.length
      : 0;
  }
}
