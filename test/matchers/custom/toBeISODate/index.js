import { matcherHint, printReceived } from 'jest-matcher-utils';

const passMessage = received => () =>
  matcherHint('.not.toBeISODate', 'received', '') +
  '\n\n' +
  'Expected value to not be an iso date received:\n' +
  `  ${printReceived(received)}`;

const failMessage = received => () =>
  matcherHint('.toBeISODate', 'received', '') +
  '\n\n' +
  'Expected value to be an iso date received:\n' +
  `  ${printReceived(received)}`;

const passMessage = (received) => `Expected ${received} to not be a valid ISO date string`
const failMessage = (received) => `Expected ${received} to be a valid ISO date string`

const predicate = (received) => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(received)) {
    return false
  }

  const d = new Date(received)
  return d.toISOString() === received
}

export function toBeISODate(expected) {
  const pass = predicate(expected)
  if (pass) {
    return { pass: true, message: () => passMessage(expected) }
  }

  return { pass: false, message: () => failMessage(expected) }
}

