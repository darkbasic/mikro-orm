import {
  Entity,
  Property,
  ManyToOne,
  Unique,
  IdentifiedReference,
  Reference,
} from 'mikro-orm';
import {BaseEntity} from './BaseEntity';
import {User} from './User';
import {Sport} from './Sport';

interface LevelConstructor {
  user: User;
  sport: Sport;
  declaredLevel: number;
}

export {Level as LevelEntity};

@Entity()
@Unique({properties: ['user', 'sport']})
export class Level extends BaseEntity {
  @ManyToOne()
  user: IdentifiedReference<User>;

  @ManyToOne()
  sport: IdentifiedReference<Sport>;

  @Property({type: 'float'})
  declaredLevel: number;

  constructor({user, sport, declaredLevel}: LevelConstructor) {
    super();
    this.user = Reference.create(user);
    this.sport = Reference.create(sport);
    this.declaredLevel = declaredLevel;
  }
}
