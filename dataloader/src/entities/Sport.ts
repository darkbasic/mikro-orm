import { Entity, Property, ManyToMany, Collection, OneToMany } from 'mikro-orm';
import { BaseEntity } from './BaseEntity';
import { Site } from './Site';
import { Specialty } from './Specialty';

interface SportConstructor {
  name: string;
}

export { Sport as SportEntity };

@Entity()
export class Sport extends BaseEntity {

  @Property()
  name: string;

  @ManyToMany(() => Site, site => site.sports)
  sites: Collection<Site> = new Collection<Site>(this);

  @OneToMany(() => Specialty, specialty => specialty.sport)
  specialties: Collection<Specialty> = new Collection<Specialty>(this);

  constructor({name}: SportConstructor) {
    super();
    this.name = name;
  }

}
