import {DataSource, DataSourceConfig} from 'apollo-datasource';
import {EntityRepository, EntityManager, AbstractSqlDriver} from 'mikro-orm';
import {ApolloContext} from '../..';
import {EntityDataLoader} from './utils';

interface OrmAPIContructor<T> {
  em: EntityManager;
  repo: EntityRepository<T>;
  dataloader: EntityDataLoader;
}

export class OrmAPI<T> extends DataSource<ApolloContext> {
  em: EntityManager<AbstractSqlDriver>;
  repo: EntityRepository<T>;
  dataloader: EntityDataLoader;

  constructor({em, repo, dataloader}: OrmAPIContructor<T>) {
    super();
    this.em = em as EntityManager<AbstractSqlDriver>;
    this.repo = repo;
    this.dataloader = dataloader;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  initialize({context}: DataSourceConfig<ApolloContext>) {}
}
