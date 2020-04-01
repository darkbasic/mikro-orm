import {Entity, Property, ManyToMany, Collection, OneToMany} from 'mikro-orm';
import {BaseEntity} from './BaseEntity';
import {Sport} from './Sport';
import {Match} from './Match';

interface SiteConstructor {
  id?: number;
  name: string;
  position: string;
  sports: Sport[];
}

export {Site as SiteEntity};

@Entity()
export class Site extends BaseEntity {
  @Property()
  name: string;

  @Property()
  position: string;

  @ManyToMany()
  sports: Collection<Sport> = new Collection<Sport>(this);

  @OneToMany(() => Match, match => match.site)
  matches: Collection<Match> = new Collection<Match>(this);

  constructor({id, name, position, sports}: SiteConstructor) {
    super({id});
    this.name = name;
    this.position = position;
    this.sports.add(...sports);
  }
}
