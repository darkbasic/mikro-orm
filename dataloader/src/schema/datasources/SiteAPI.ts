import {OrmAPI} from './OrmAPI';
import {Site} from '../../entities/Site';
import {Sport} from '../../entities/Sport';
import {Match} from '../../entities/Match';

export class SiteAPI extends OrmAPI<Site> {
  getSites(): Promise<Site[]> {
    return this.repo.findAll();
  }

  getSiteSports({sports}: Site): Promise<Sport[]> {
    return this.dataloader.load(sports);
  }

  getSiteMatches({matches}: Site): Promise<Match[]> {
    return this.dataloader.load(matches);
  }
}
