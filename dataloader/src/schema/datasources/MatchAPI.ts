import {ensureIsNum, getItemNoPopulate} from './utils';
import {GraphQLResolveInfo} from 'graphql';
import {OrmAPI} from './OrmAPI';
import {Match} from '../../entities/Match';
import {User} from '../../entities/User';
import {Specialty} from '../../entities/Specialty';
import {Site} from '../../entities/Site';

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

  getMatchPartecipants({partecipants}: Match): Promise<User[]> {
    return this.dataloader.load(partecipants);
  }

  getMatchSite({site}: Match, info?: GraphQLResolveInfo): Promise<Site> | Site {
    return getItemNoPopulate(site, info) || this.dataloader.load(site);
  }
}
