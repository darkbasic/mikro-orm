import {IdEntity, PrimaryKey} from 'mikro-orm';

interface BaseEntityConstructor {
  id?: number;
}

export abstract class BaseEntity implements IdEntity<BaseEntity> {
  @PrimaryKey()
  id!: number;

  constructor({id}: BaseEntityConstructor = {}) {
    if (id) {
      this.id = id;
    }
  }
}
