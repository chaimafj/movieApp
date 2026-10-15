import { describe, expect, it } from 'vitest';
import { findMatches, matchScore } from './matching';
import { UserProfile } from './models';

const fav = (id: string) => ({ id, title: id, posterUrl: null, releaseDate: '' });
const user = (uid: string, ids: string[], disabled = false): UserProfile => ({
  uid,
  email: `${uid}@test.fr`,
  nom: uid,
  prenom: uid,
  age: 20,
  photo: '',
  role: 'user',
  disabled,
  favorites: ids.map(fav),
  createdAt: 0,
});

describe('matchScore', () => {
  it('vaut 1 pour des listes identiques', () => {
    expect(matchScore(['a', 'b'], ['b', 'a'])).toBe(1);
  });
  it('vaut 0 si une liste est vide ou sans film commun', () => {
    expect(matchScore([], ['a'])).toBe(0);
    expect(matchScore(['a'], ['b'])).toBe(0);
  });
  it('calcule |A∩B| / |A∪B|', () => {
    expect(matchScore(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd', 'e'])).toBeCloseTo(0.8);
    expect(matchScore(['a', 'b', 'c'], ['a', 'b', 'c', 'd'])).toBe(0.75);
  });
});

describe('findMatches', () => {
  it('ne garde que les utilisateurs actifs au-dessus de 75% (strict), triés', () => {
    const me = user('me', ['a', 'b', 'c', 'd']);
    const result = findMatches(me, [
      me,
      user('same', ['a', 'b', 'c', 'd']),
      user('close', ['a', 'b', 'c', 'd', 'e']),
      user('exact75', ['a', 'b', 'c']),
      user('far', ['a', 'x']),
      user('off', ['a', 'b', 'c', 'd'], true),
    ]);
    expect(result.map((m) => m.user.uid)).toEqual(['same', 'close']);
    expect(result[1].common.length).toBe(4);
  });
});
