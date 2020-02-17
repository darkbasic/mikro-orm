import { AnyEntity, Constructor, EntityMetadata, EntityName, EntityProperty } from '../typings';
import {
  EnumOptions, IndexOptions, ManyToManyOptions, ManyToOneOptions, OneToManyOptions, OneToOneOptions, PrimaryKeyOptions,
  PropertyOptions, SerializedPrimaryKeyOptions, UniqueOptions,
} from '../decorators';
import { Cascade, Collection, EntityRepository, ReferenceType } from '../entity';
import { Type } from '../types';
import { Utils } from '../utils';

type CollectionItem<T> = T extends Collection<infer K> ? K : T;
type TypeDef<T> = { type: string | Constructor<Type> } | { customType: Type } | { entity: string | (() => string | EntityName<T>) };
type Property<T> =
  | ({ reference: ReferenceType.MANY_TO_ONE | 'm:1' } & TypeDef<T> & ManyToOneOptions<T>)
  | ({ reference: ReferenceType.ONE_TO_ONE | '1:1' } & TypeDef<T> & OneToOneOptions<T>)
  | ({ reference: ReferenceType.ONE_TO_MANY | '1:m' } & TypeDef<T> & OneToManyOptions<T>)
  | ({ reference: ReferenceType.MANY_TO_MANY | 'm:n' } & TypeDef<T> & ManyToManyOptions<T>)
  | ({ enum: true } & EnumOptions)
  | (TypeDef<T> & PropertyOptions);
type Metadata<T, U> =
  & Omit<Partial<EntityMetadata<T>>, 'name' | 'properties'>
  & ({ name: string } | { class: Constructor<T>; name?: string })
  & { properties?: { [K in keyof Omit<T, keyof U> & string]-?: Property<CollectionItem<NonNullable<T[K]>>> } };

export class EntitySchema<T extends AnyEntity<T> = AnyEntity, U extends AnyEntity<T> | undefined = undefined> {

  private readonly _meta: EntityMetadata<T> = {} as EntityMetadata<T>;
  private initialized = false;

  constructor(meta: Metadata<T, U>) {
    meta.name = meta.class ? meta.class.name : meta.name;
    Object.assign(this._meta, { className: meta.name, properties: {}, hooks: {}, indexes: [], uniques: [] }, meta);
  }

  addProperty(name: string & keyof T, type: string | Constructor<Type>, options: PropertyOptions | EntityProperty = {}): void {
    if ('entity' in options) {
      if (Utils.isString(options.entity)) {
        type = options.type = options.entity;
      } else if (options.entity) {
        type = options.type = Utils.className(options.entity());
      }
    }

    const prop = { name, reference: ReferenceType.SCALAR, ...options, type };
    this._meta.properties[name] = prop as EntityProperty<T>;
  }

  addEnum(name: string & keyof T, type: string | Constructor<Type> = 'enum', options: EnumOptions = {}): void {
    if (options.items instanceof Function) {
      const type = options.items();
      const keys = Object.keys(type);
      options.items = Object.values<string>(type).filter(val => !keys.includes(val));
    }

    const prop = { enum: true, ...options };
    this.addProperty(name, type, prop);
  }

  addVersion(name: string & keyof T, type: string | Constructor<Type>, options: PropertyOptions = {}): void {
    const prop = { version: true, ...options };
    this.addProperty(name, type, prop);
  }

  addPrimaryKey(name: string & keyof T, type: string | Constructor<Type>, options: PrimaryKeyOptions = {}): void {
    const prop = { primary: true, ...options };
    this.addProperty(name, type, prop);
  }

  addSerializedPrimaryKey(name: string & keyof T, type: string | Constructor<Type>, options: SerializedPrimaryKeyOptions = {}): void {
    this._meta.serializedPrimaryKey = name;
    this.addProperty(name, type, options);
  }

  addManyToOne<K = object>(name: string & keyof T, type: string | Constructor<Type>, options: ManyToOneOptions<K>): void {
    const prop = { reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST, Cascade.MERGE], ...options };
    Utils.defaultValue(prop, 'nullable', prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL));
    this.addProperty(name, type, prop);
  }

  addManyToMany<K = object>(name: string & keyof T, type: string | Constructor<Type>, options: ManyToManyOptions<K>): void {
    options.fixedOrder = options.fixedOrder || !!options.fixedOrderColumn;

    if (!options.owner && !options.mappedBy) {
      options.owner = true;
    }

    if (options.owner) {
      Utils.renameKey(options, 'mappedBy', 'inversedBy');
    }

    const prop = { reference: ReferenceType.MANY_TO_MANY, cascade: [Cascade.PERSIST, Cascade.MERGE], ...options };
    this.addProperty(name, type, prop);
  }

  addOneToMany<K = object>(name: string & keyof T, type: string | Constructor<Type>, options: OneToManyOptions<K>): void {
    const prop = { reference: ReferenceType.ONE_TO_MANY, cascade: [Cascade.PERSIST, Cascade.MERGE], ...options };
    this.addProperty(name, type, prop);
  }

  addOneToOne<K = object>(name: string & keyof T, type: string | Constructor<Type>, options: OneToOneOptions<K>): void {
    const prop = { reference: ReferenceType.ONE_TO_ONE, cascade: [Cascade.PERSIST, Cascade.MERGE], ...options };
    Utils.defaultValue(prop, 'nullable', prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL));
    prop.owner = prop.owner || !!prop.inversedBy || !prop.mappedBy;
    prop.unique = prop.owner;

    if (prop.owner && options.mappedBy) {
      Utils.renameKey(prop, 'mappedBy', 'inversedBy');
    }

    this.addProperty(name, type, prop);
  }

  addIndex(options: IndexOptions): void {
    this._meta.indexes.push(options as Required<IndexOptions>);
  }

  addUnique(options: UniqueOptions): void {
    this._meta.uniques.push(options as Required<UniqueOptions>);
  }

  setCustomRepository(repository: () => Constructor<EntityRepository<T>>): void {
    this._meta.customRepository = repository;
  }

  setExtends(base: string): void {
    this._meta.extends = base;
  }

  setClass(proto: Constructor<T>) {
    this._meta.class = proto;
    this._meta.prototype = proto.prototype;
    this._meta.className = proto.name;
    this._meta.constructorParams = Utils.getParamNames(proto, 'constructor');
    this._meta.toJsonParams = Utils.getParamNames(proto, 'toJSON').filter(p => p !== '...args');
    this._meta.extends = this._meta.extends || Object.getPrototypeOf(proto).name || undefined;
  }

  get meta() {
    return this._meta;
  }

  get name() {
    return this._meta.name;
  }

  init() {
    if (this.initialized) {
      return this;
    }

    if (this._meta.class) {
      this.setClass(this._meta.class);
    } else {
      this.setClass(({ [this.name]: class {} })[this.name] as Constructor<T>);
    }

    if (this._meta.abstract) {
      delete this._meta.name;
    }

    Object.entries<Property<T[keyof T]>>(this._meta.properties).forEach(([name, options]) => {
      options.type = 'customType' in options ? options.customType.constructor.name : options.type;

      switch ((options as EntityProperty).reference) {
        case ReferenceType.ONE_TO_ONE: this.addOneToOne(name as keyof T & string, options.type, options); break;
        case ReferenceType.ONE_TO_MANY: this.addOneToMany(name as keyof T & string, options.type, options); break;
        case ReferenceType.MANY_TO_ONE: this.addManyToOne(name as keyof T & string, options.type, options); break;
        case ReferenceType.MANY_TO_MANY: this.addManyToMany(name as keyof T & string, options.type, options); break;
        default:
          if ((options as EntityProperty).enum) {
            this.addEnum(name as keyof T & string, options.type, options);
          } else if (options.primary) {
            this.addPrimaryKey(name as keyof T & string, options.type, options);
          } else if (options.serializedPrimaryKey) {
            this.addSerializedPrimaryKey(name as keyof T & string, options.type, options);
          } else if (options.version) {
            this.addVersion(name as keyof T & string, options.type, options);
          } else {
            this.addProperty(name as keyof T & string, options.type, options);
          }
      }
    });

    const pks = Object.values<EntityProperty<T>>(this._meta.properties).filter(prop => prop.primary);

    if (pks.length > 0) {
      this._meta.primaryKey = pks[0].name;
      this._meta.primaryKeys = pks.map(prop => prop.name);
      this._meta.compositePK = pks.length > 1;
    }

    const serializedPrimaryKey = Object.values<EntityProperty<T>>(this._meta.properties).find(prop => prop.serializedPrimaryKey);

    if (serializedPrimaryKey) {
      this._meta.serializedPrimaryKey = serializedPrimaryKey.name;
    }

    this.initialized = true;

    return this;
  }

}
