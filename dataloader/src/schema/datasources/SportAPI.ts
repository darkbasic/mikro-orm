import {OrmAPI} from './OrmAPI';
import {Sport} from '../../entities/Sport';
import {Specialty} from '../../entities/Specialty';
import {Site} from '../../entities/Site';

export class SportAPI extends OrmAPI<Sport> {
  getSports(): Promise<Sport[]> {
    return this.repo.findAll();
  }

  getSportSpecialties({specialties}: Sport): Promise<Specialty[]> {
    return this.dataloader.load(specialties);
  }

  getSportSites({sites}: Sport): Promise<Site[]> {
    return this.dataloader.load(sites);
  }
}
