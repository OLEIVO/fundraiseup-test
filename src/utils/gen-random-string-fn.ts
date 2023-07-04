import { genRandomCharFn } from './gen-random-char-fn'

export const genRandomStringFn = (length = 10) =>
    Array.from({ length }, genRandomCharFn).join('')
