




export const isSpace = (input) => input === " ";
export const isDigit = (input) => /^[0-9]$/.test(input);
export const isLetter = (input) => /^[a-zA-Z]$/.test(input);
export const isAlphaNumeric = (input) => isDigit(input) || isLetter(input);
/** Returns true if `c` is an upper case ASCII letter. */
export const isUpper = c => isLetter(c) && c == c.toUpperCase();
/** Returns true if `c` is a lower case ASCII letter. */
export const isLower = c => isLetter(c) && c == c.toLowerCase();
/** Takes a predicate function and returns its inverse. */
export const not = f => c => !f(c);