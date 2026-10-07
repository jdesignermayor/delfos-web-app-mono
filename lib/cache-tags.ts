/** Cache tag for public property listings (landing carousel); property mutations revalidate it. */
export const PROPERTIES_CACHE_TAG = "properties";

/**
 * Cache tag for signed-in users' profiles (role, constructora, flags), read on
 * every dashboard request. Updating a user or enabling/disabling a constructora
 * expires it with `updateTag`, so access changes apply on the next request.
 */
export const USER_PROFILES_CACHE_TAG = "user-profiles";
