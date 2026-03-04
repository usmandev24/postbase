import QuickLRU from "quick-lru";

export const cacheStore = new QuickLRU({maxSize: 10000}); 

