export const COLLECTIONS = {
    USERS: "Users",
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
