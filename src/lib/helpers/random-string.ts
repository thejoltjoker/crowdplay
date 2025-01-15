import { adjectives } from "./adjectives";
import { animals } from "./animals";

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function randomAnimal(): string {
  return animals[Math.floor(Math.random() * animals.length)];
}

export function randomAdjective(): string {
  return adjectives[Math.floor(Math.random() * adjectives.length)];
}

export function randomString(): string {
  return [
    capitalize(randomAdjective()),
    capitalize(randomAdjective()),
    capitalize(randomAnimal()),
  ].join("");
}

export function randomTestString(): string {
  return [
    capitalize("Strong"),
    capitalize("Curious"),
    capitalize(randomAnimal()),
  ].join("");
}
