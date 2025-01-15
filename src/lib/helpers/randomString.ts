import { adjectives } from './adjectives';
import { animals } from './animals';

export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1);

export const randomAnimal = (): string => animals[Math.floor(Math.random() * animals.length)];

export const randomAdjective = (): string =>
	adjectives[Math.floor(Math.random() * adjectives.length)];

export const randomString = (): string => {
	return [
		capitalize(randomAdjective()),
		capitalize(randomAdjective()),
		capitalize(randomAnimal())
	].join('');
};

export const randomTestString = (): string => {
	return [capitalize('Strong'), capitalize('Curious'), capitalize(randomAnimal())].join('');
};
