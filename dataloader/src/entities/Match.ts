import {
  Entity,
  Property,
  ManyToMany,
  Collection,
  ManyToOne,
  IdentifiedReference,
  Reference,
} from 'mikro-orm';
import {BaseEntity} from './BaseEntity';
import {User} from './User';
import {Specialty} from './Specialty';
import {Site} from './Site';

interface MatchConstructor {
  date: Date;
  creator: User;
  specialty: Specialty;
  site: Site;
  partecipants: User[];
}

export {Match as MatchEntity};

@Entity()
export class Match extends BaseEntity {
  @Property()
  date: Date;

  @ManyToOne()
  creator: IdentifiedReference<User>;

  @ManyToOne()
  specialty: IdentifiedReference<Specialty>;

  @ManyToOne()
  site: IdentifiedReference<Site>;

  @ManyToMany()
  partecipants: Collection<User> = new Collection<User>(this);

  constructor({
    date,
    creator,
    specialty,
    site,
    partecipants,
  }: MatchConstructor) {
    super();
    this.date = date;
    this.creator = Reference.create(creator);
    this.specialty = Reference.create(specialty);
    this.site = Reference.create(site);
    this.partecipants.add(...partecipants);
  }
}
