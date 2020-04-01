import {
  DateTimeResolver,
  URLResolver,
  EmailAddressResolver,
} from 'graphql-scalars';
import {Resolvers} from '../../../types/graphql';

const resolvers: Resolvers & {Sex?: object; Status?: object} = {
  Date: DateTimeResolver,
  URL: URLResolver,
  EmailAddress: EmailAddressResolver,

  Sex: {
    MALE: 0,
    FEMALE: 1,
  },

  Status: {
    PENDING: 0,
    ACCEPTED: 1,
    DECLINED: 2,
    BLOCKED: 3,
  },

  User: {
    createdMatches(user, args, {dataSources: {UserAPI}}) {
      return UserAPI.getUserCreatedMatches(user);
    },
    partecipatedMatches(user, args, {dataSources: {UserAPI}}) {
      return UserAPI.getUserPartecipatedMatches(user);
    },
    level(user, {sportId}, {dataSources: {UserAPI}}) {
      return UserAPI.getUserLevel(user, sportId);
    },
  },

  Site: {
    sports(site, args, {dataSources: {SiteAPI}}) {
      return SiteAPI.getSiteSports(site);
    },
    matches(site, args, {dataSources: {SiteAPI}}) {
      return SiteAPI.getSiteMatches(site);
    },
  },

  Sport: {
    specialties(sport, args, {dataSources: {SportAPI}}) {
      return SportAPI.getSportSpecialties(sport);
    },
    sites(sport, args, {dataSources: {SportAPI}}) {
      return SportAPI.getSportSites(sport);
    },
  },

  Specialty: {
    sport(specialty, args, {dataSources: {SpecialtyAPI}}, info) {
      return SpecialtyAPI.getSpecialtySport(specialty, info);
    },
    matches(specialty, args, {dataSources: {SpecialtyAPI}}) {
      return SpecialtyAPI.getSpecialtyMatches(specialty);
    },
  },

  Match: {
    creator(match, args, {dataSources: {MatchAPI}}, info) {
      return MatchAPI.getMatchCreator(match, info);
    },
    specialty(match, args, {dataSources: {MatchAPI}}, info) {
      return MatchAPI.getMatchSpecialty(match, info);
    },
    partecipants(match, args, {dataSources: {MatchAPI}}) {
      return MatchAPI.getMatchPartecipants(match);
    },
    site(match, args, {dataSources: {MatchAPI}}, info) {
      return MatchAPI.getMatchSite(match, info);
    },
    averageLevel(match, args, {dataSources: {MatchAPI}}) {
      return MatchAPI.getMatchAverageLevel(match);
    },
  },

  Query: {
    users(root, args, {dataSources: {UserAPI}}) {
      return UserAPI.getUsers();
    },
    sites(root, args, {dataSources: {SiteAPI}}) {
      return SiteAPI.getSites();
    },
    sports(root, args, {dataSources: {SportAPI}}) {
      return SportAPI.getSports();
    },
    specialties(root, {sportId}, {dataSources: {SpecialtyAPI}}) {
      return SpecialtyAPI.getSpecialties(sportId);
    },
    matches(root, {sportId, specialtyIds}, {dataSources: {MatchAPI}}) {
      return MatchAPI.getMatches(sportId, specialtyIds);
    },
  },
};

export default resolvers;
