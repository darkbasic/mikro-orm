import {DataSource, DataSourceConfig} from 'apollo-datasource';
import {EntityRepository} from 'mikro-orm';
import {ApolloContext} from '../..';
import {EntityDataLoader} from './utils';

interface OrmAPIContructor<T> {
  repo: EntityRepository<T>;
  dataloader: EntityDataLoader;
}

export class OrmAPI<T> extends DataSource<ApolloContext> {
  repo: EntityRepository<T>;
  dataloader: EntityDataLoader;

  constructor({repo, dataloader}: OrmAPIContructor<T>) {
    super();
    this.repo = repo;
    this.dataloader = dataloader;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  initialize({context}: DataSourceConfig<ApolloContext>) {}
}
