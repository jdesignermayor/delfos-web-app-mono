/**
 * TanStack Query keys, in one place so queries and the mutations that
 * invalidate them always agree. Each entity's keys nest under its `all` key.
 */
export const queryKeys = {
  developers: {
    all: ["developers"] as const,
    list: () => [...queryKeys.developers.all, "list"] as const,
    detail: (developerId: number) => [...queryKeys.developers.all, developerId] as const,
  },
  trustCompanies: {
    all: ["trust-companies"] as const,
    list: () => [...queryKeys.trustCompanies.all, "list"] as const,
    detail: (trustCompanyId: string) => [...queryKeys.trustCompanies.all, trustCompanyId] as const,
  },
  banks: {
    all: ["banks"] as const,
    list: () => [...queryKeys.banks.all, "list"] as const,
    detail: (bankId: string) => [...queryKeys.banks.all, bankId] as const,
  },
  commonAreas: {
    all: ["common-areas"] as const,
    list: () => [...queryKeys.commonAreas.all, "list"] as const,
    detail: (commonAreaId: string) => [...queryKeys.commonAreas.all, commonAreaId] as const,
  },
};
