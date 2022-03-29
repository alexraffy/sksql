




export const isSpace = (input) => input === " ";
export const isDigit = (input) => /^[0-9]$/.test(input);
export const isLetter = (input) => /^[a-zA-Z]$/.test(input);
export const isAlphaNumeric = (input) => isDigit(input) || isLetter(input);
export const isUpper = c => isLetter(c) && c == c.toUpperCase();
export const isLower = c => isLetter(c) && c == c.toLowerCase();
export const not = f => c => !f(c);