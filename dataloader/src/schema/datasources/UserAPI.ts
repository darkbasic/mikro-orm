import {OrmAPI} from './';
import {User} from '../../entities/User';
import {Match} from '../../entities/Match';

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
}
