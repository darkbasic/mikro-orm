import {GraphQLResolveInfo} from 'graphql';
import {
  Reference,
  AnyEntity,
  EntityManager,
  Primary,
  IdentifiedReference,
  Collection,
  WrappedEntity,
  wrap,
} from 'mikro-orm';
import DataLoader from 'dataloader';

export function ensureIsNum(id: string | number): number;
export function ensureIsNum(id?: null | string | number): number | undefined;
export function ensureIsNum(ids: string[] | number[]): number[];
export function ensureIsNum(
  ids?: null | string[] | number[]
): number[] | undefined;
export function ensureIsNum(
  idOrIds: null | undefined | string | number | (string | number)[]
): undefined | number | number[] {
  if (idOrIds === null || idOrIds === undefined) {
    return undefined;
  }
  if (idOrIds instanceof Array) {
    return idOrIds.map(id => {
      const num = Number(id);
      if (isNaN(num)) {
        throw new Error(`The ID ${id} is not a valid number`);
      }
      return num;
    });
  } else {
    const num = Number(idOrIds);
    if (isNaN(num)) {
      throw new Error(`The ID ${idOrIds} is not a valid number`);
    }
    return num;
  }
}

export function shouldPopulate({fieldNodes}: GraphQLResolveInfo): boolean {
  if (fieldNodes.length === 1) {
    const selections = fieldNodes[0].selectionSet?.selections;
    if (selections?.length === 1) {
      if (selections[0].kind !== 'InlineFragment') {
        return selections[0].name.value !== 'id';
      }
    }
  }
  return true;
}

export function getItemNoPopulate<T>(
  ref: Reference<T>,
  info?: GraphQLResolveInfo
): T | undefined {
  return !info || shouldPopulate(info) ? undefined : ((ref as unknown) as T);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAllPropertyNames(obj: any) {
  const props: string[] = [];

  do {
    Object.getOwnPropertyNames(obj).forEach(prop => {
      if (props.indexOf(prop) === -1) {
        props.push(prop);
      }
    });
  } while ((obj = Object.getPrototypeOf(obj)));

  return props;
}

interface Id {
  id: number | string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hasRef<T>(
  entity: T
): T &
  WrappedEntity<T, keyof T> &
  Record<string, IdentifiedReference<AnyEntity>> {
  return entity as T &
    WrappedEntity<T, keyof T> &
    Record<string, IdentifiedReference<AnyEntity>>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hasCol<T>(
  entity: T
): T & WrappedEntity<T, keyof T> & Record<string, Collection<AnyEntity>> {
  return entity as T &
    WrappedEntity<T, keyof T> &
    Record<string, Collection<AnyEntity>>;
}

function hasRefOrCol<T>(
  entity: T
): T &
  WrappedEntity<T, keyof T> &
  Record<string, IdentifiedReference<AnyEntity> | Collection<AnyEntity>> {
  return entity as T &
    WrappedEntity<T, keyof T> &
    Record<string, IdentifiedReference<AnyEntity> | Collection<AnyEntity>>;
}

function isRef<T>(
  refOrCol: IdentifiedReference<T> | Collection<T>
): refOrCol is IdentifiedReference<T> {
  return !(refOrCol instanceof Collection);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isCol<T>(
  refOrCol: IdentifiedReference<T> | Collection<T>
): refOrCol is Collection<T> {
  return refOrCol instanceof Collection;
}

export function groupPrimaryKeysByEntity<T extends AnyEntity<T>>(
  refs: readonly Reference<T>[]
) {
  return refs.reduce((acc, cur) => {
    const {className} = cur.__meta;
    const primaryKeys: Primary<T>[] = acc[className];
    const primaryKey: Primary<T> = cur.__primaryKey;
    acc[className] = primaryKeys
      ? [...new Set([...primaryKeys, primaryKey])]
      : [primaryKey];
    return acc;
  }, {} as Record<string, Primary<T>[]>);
}

export function groupInversedOrMappedKeysByEntity<T extends AnyEntity<T>>(
  collections: readonly Collection<T>[]
): Record<string, Record<string, Primary<T>[]>> {
  return collections.reduce((acc, cur) => {
    const className = cur.property.type;
    const record = acc[className] || (acc[className] = {});
    // Many to Many vs One to Many
    const inversedOrMappedBy = cur.property.inversedBy
      ? 'inversedBy'
      : cur.property.mappedBy
      ? 'mappedBy'
      : undefined;
    if (!inversedOrMappedBy) {
      throw new Error('Cannot find inversedBy or mappedBy prop');
    }
    const key: Primary<T> = cur.owner.__primaryKey;
    const keys: Primary<T>[] = record[cur.property[inversedOrMappedBy]];
    record[cur.property[inversedOrMappedBy]] = keys
      ? [...new Set([...keys, key])]
      : [key];
    return acc;
  }, {} as Record<string, Record<string, Primary<T>[]>>);
}

export class EntityDataLoader<T extends Id = Id, K = AnyEntity<T, 'id'>> {
  private bypass: boolean;
  private refLoader: DataLoader<IdentifiedReference<K>, K>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private colLoader: DataLoader<Collection<any>, K[]>;

  constructor(em: EntityManager, bypass = false) {
    this.bypass = bypass;

    this.refLoader = new DataLoader<IdentifiedReference<K>, K>(async refs => {
      const groupedIds = groupPrimaryKeysByEntity(refs);
      const promises = Object.entries(groupedIds).map(([entity, ids]) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return em.getRepository<K>(entity).find(ids as any);
        } catch (e) {
          return Promise.reject(e as Error);
        }
      });
      await Promise.all(promises);
      return Promise.all(refs.map(async ref => await ref.load()));
    });

    this.colLoader = new DataLoader<Collection<K>, K[]>(async collections => {
      const groupedIds = groupInversedOrMappedKeysByEntity(collections);
      const promises: Promise<K[]>[] = Object.entries(groupedIds).map(
        ([entity, record]) => {
          try {
            return em
              .getRepository<K>(entity)
              .find(record, Object.keys(record));
          } catch (e) {
            return Promise.reject(e as Error);
          }
        }
      );
      const results = (await Promise.all(promises))
        .flat()
        .map(entity => wrap(entity));
      return collections.map(collection =>
        results.filter(result => {
          // Class matches
          if (result.__meta.className === collection.property.type) {
            const inversedOrMappedBy = collection.property.inversedBy
              ? 'inversedBy'
              : collection.property.mappedBy
              ? 'mappedBy'
              : undefined;
            if (!inversedOrMappedBy) {
              throw new Error('Cannot find inversedBy or mappedBy prop');
            }
            const refOrCol = hasRefOrCol(result)[
              collection.property[inversedOrMappedBy]
            ];
            return isRef(refOrCol)
              ? refOrCol.__primaryKey === collection.owner.__primaryKey
              : refOrCol
                  .getItems()
                  .map(el => el.__primaryKey)
                  .includes(collection.owner.__primaryKey);
          }
          return false;
        })
      );
    });
  }

  load<L extends K>(ref: IdentifiedReference<L>, bypass?: boolean): Promise<L>;
  load<L extends K>(collection: Collection<L>, bypass?: boolean): Promise<L[]>;
  load<L extends K>(
    refOrCol: IdentifiedReference<L> | Collection<L>,
    bypass?: boolean
  ): Promise<L> | Promise<L[]> {
    if (isRef(refOrCol)) {
      return bypass ?? this.bypass
        ? refOrCol.load()
        : (this.refLoader.load(refOrCol) as Promise<L>);
    } else {
      return bypass ?? this.bypass
        ? refOrCol.loadItems()
        : (this.colLoader.load(refOrCol) as Promise<L[]>);
    }
  }
}
