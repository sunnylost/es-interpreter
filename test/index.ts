import { interpret } from '../src'

const result = interpret(`
var a = 1;
var b = 1;
console.log(a + b);
`)

console.log('Result = ', result)
