export default {
  entitiesDirs: ['./build/src/entities'],
  entitiesDirsTs: ['./src/entities'],
  dbName: 'mikro_orm_test',
  type: 'postgresql' as `postgresql`,
  forceUtcTimezone: true,
  debug: true,
};
