import {
  Entity,
  Property,
  Enum,
  OneToMany,
  Collection,
  ManyToMany,
} from 'mikro-orm';
import {BaseEntity} from './BaseEntity';
import {Match} from './Match';

export enum Sex {
  MALE,
  FEMALE,
}

interface UserContructor {
  id?: number;
  email: string;
  name: string;
  surname: string;
  sex: Sex;
  password: string;
  picture?: string;
}

export {User as UserEntity};

@Entity()
export class User extends BaseEntity {
  @Property()
  email: string;

  @Property()
  name: string;

  @Property()
  surname: string;

  @Enum()
  sex: Sex;

  @Property()
  password: string;

  @Property()
  picture?: string;

  @OneToMany(() => Match, match => match.creator)
  createdMatches: Collection<Match> = new Collection<Match>(this);

  @ManyToMany(() => Match, match => match.partecipants)
  partecipatedMatches: Collection<Match> = new Collection<Match>(this);

  constructor({
    id,
    email,
    name,
    surname,
    sex,
    password,
    picture,
  }: UserContructor) {
    super({id});
    this.email = email;
    this.name = name;
    this.surname = surname;
    this.sex = sex;
    this.password = password;
    if (picture) {
      this.picture = picture;
    }
  }
}
