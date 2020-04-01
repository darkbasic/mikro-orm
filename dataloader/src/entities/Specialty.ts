import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  IdentifiedReference,
  Reference,
} from 'mikro-orm';
import {BaseEntity} from './BaseEntity';
import {Sport} from './Sport';
import {Match} from './Match';

interface SpecialtyConstructor {
  id?: number;
  name: string;
  males: number;
  females: number;
  sport: Sport;
}

export {Specialty as SpecialtyEntity};

@Entity()
export class Specialty extends BaseEntity {
  @Property()
  name: string;

  @Property()
  males: number;

  @Property()
  females: number;

  @ManyToOne()
  sport: IdentifiedReference<Sport>;

  @OneToMany(() => Match, match => match.specialty)
  matches: Collection<Match> = new Collection<Match>(this);

  constructor({id, name, males, females, sport}: SpecialtyConstructor) {
    super({id});
    this.name = name;
    this.males = males;
    this.females = females;
    this.sport = Reference.create(sport);
  }
}
