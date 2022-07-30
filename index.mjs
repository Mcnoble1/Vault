import {loadStdlib} from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask, yesno, done } from '@reach-sh/stdlib/ask.mjs'; // used in console apps

const stdlib = loadStdlib(process.env);

const startingBalance = stdlib.parseCurrency(100);

const accBob = await stdlib.newTestAccount(startingBalance);

const accAlice = await stdlib.newTestAccount(stdlib.parseCurrency(6000));

console.log('Hello, Alice and Bob!');

console.log('Launching...');
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());

const getBalance = async (who) => stdlib.formatCurrency(await stdlib.balanceOf(who));

console.log(`Alice's balance before is ${await getBalance(accAlice)}`);
console.log(`Bob's balance before is ${await getBalance(accBob)}`);

const Shared = () => ({
  showTime: (time) => {
      console.log(time);
    },
  informTimeout: () => {
    console.log(`There was a timeout`);
    process.exit(1);
  },
})

const choiceArray = ["I'm not here", "I'm still here"];

console.log('Starting backends...');
await Promise.all([
  backend.Alice(ctcAlice, {
    ...stdlib.hasRandom,
    ...Shared(),
    deadline: 10,
    inherit: async () => {
      const amt = await ask(
      `How much would you like put in the vault?`,
      stdlib.parseCurrency,
    )
      console.log(amt)
      console.log(`Alice funded the vault with ${stdlib.formatCurrency(amt)}`);
      return amt;
    },
    getChoice: async () => {
      const choice = await ask(
        'Do you still want to be here? (y/n)',	
        yesno,
      )
      console.log(choice)
      console.log(`Alice choice is ${choiceArray[(choice === false) ? 0 : 1]}`);
      return choice;
    },
    // implement Alice's interact object here
  }),
  backend.Bob(ctcBob, {
    ...stdlib.hasRandom,
    ...Shared(),
    acceptTerms: async (num) => {
        const accepted = await ask(
            `Do you accept the terms of ${stdlib.formatCurrency(num)} tokens ?`,
            yesno,
        )
       if (!accepted) {
            console.log(`Bob did not accept the terms of ${stdlib.formatCurrency(num)} tokens `);
            process.exit(0)
        } else {
          console.log(`Bob accepted the terms of ${stdlib.formatCurrency(num)} tokens `);
          return true;
        }
    }
    // implement Bob's interact object here
  }),
]);

console.log(`Alice's balance after is ${await getBalance(accAlice)}`);
console.log(`Bob's balance after is ${await getBalance(accBob)}`);

console.log('Goodbye, Alice and Bob!');

done();
