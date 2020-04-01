import {OrmAPI} from './';
import {User} from '../../entities/User';
import {Match} from '../../entities/Match';
import {Level} from '../../entities/Level';
import {ensureIsNum} from './utils';

export class UserAPI extends OrmAPI<User> {
  getUsers(): Promise<User[]> {
    return this.repo.findAll();
  }

  getUserCreatedMatches({createdMatches}: User): Promise<Match[]> {
    return this.dataloader.load(createdMatches);
  }

  getUserPartecipatedMatches({partecipatedMatches}: User): Promise<Match[]> {
    return this.dataloader.load(partecipatedMatches);
  }

  async getUserLevel({id}: User, sportId: number | string): Promise<number> {
    const level = await this.dataloader.findOne(this.em.getRepository(Level), {
      user: id,
      sport: ensureIsNum(sportId),
    });

    return level?.declaredLevel ?? 0;
  }
}
