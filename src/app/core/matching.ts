import { FavoriteMovie, UserMatch, UserProfile } from './models';

/** Seuil minimum (strictement dépassé) pour considérer deux utilisateurs comme compatibles. */
export const MATCH_THRESHOLD = 0.75;

/**
 * Taux de correspondance entre deux listes de favoris (indice de Jaccard) :
 * |A ∩ B| / |A ∪ B|. Vaut 1 si les listes sont identiques, 0 si elles n'ont rien en commun.
 */
export function matchScore(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 || setB.size === 0) {
    return 0;
  }
  let common = 0;
  setA.forEach((id) => {
    if (setB.has(id)) {
      common++;
    }
  });
  return common / (setA.size + setB.size - common);
}

/** Retourne les utilisateurs actifs dont le taux de correspondance dépasse le seuil, triés par score. */
export function findMatches(
  me: UserProfile,
  others: UserProfile[],
  threshold = MATCH_THRESHOLD,
): UserMatch[] {
  const myIds = me.favorites.map((f) => f.id);
  const myIdSet = new Set(myIds);
  return others
    .filter((u) => u.uid !== me.uid && !u.disabled)
    .map((user) => {
      const ids = (user.favorites ?? []).map((f) => f.id);
      const common: FavoriteMovie[] = (user.favorites ?? []).filter((f) => myIdSet.has(f.id));
      return { user, score: matchScore(myIds, ids), common };
    })
    .filter((m) => m.score > threshold)
    .sort((x, y) => y.score - x.score);
}
