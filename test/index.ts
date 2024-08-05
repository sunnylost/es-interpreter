import { interpret } from '../src'

const result = interpret(`
let a = 1;
var b = 1;
const c = 1;
// function b() {
//   console.log(a);
// }

// b();
// let b = a + 1;
`)

console.log('Result = ', result)
