import {ensureIsNum, getItemNoPopulate} from './utils';
import {GraphQLResolveInfo} from 'graphql';
import {OrmAPI} from './OrmAPI';
import {Specialty} from '../../entities/Specialty';
import {Sport} from '../../entities/Sport';
import {Match} from '../../entities/Match';

export class SpecialtyAPI extends OrmAPI<Specialty> {
  getSpecialties(sportId?: number | string | null): Promise<Specialty[]> {
    return this.repo.find({
      ...(sportId && {
        sport: ensureIsNum(sportId),
      }),
    });
  }

  getSpecialtySport(
    {sport}: Specialty,
    info?: GraphQLResolveInfo
  ): Promise<Sport> | Sport {
    return getItemNoPopulate(sport, info) || this.dataloader.load(sport);
  }

  getSpecialtyMatches({matches}: Specialty): Promise<Match[]> {
    return this.dataloader.load(matches);
  }
}
