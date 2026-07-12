import { parseTransaction } from './src/modules/transaction/utils/transactionClassifier';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("==========================================");
console.log("🤖 TRANSACTION CLASSIFIER TEST TERMINAL 🤖");
console.log("==========================================");
console.log("Type a transaction (e.g. 'ăn phở 45k') and press Enter.");
console.log("Type 'exit' or 'quit' to close.");
console.log("------------------------------------------");

function promptUser() {
  rl.question('\n> Input: ', (answer) => {
    const text = answer.trim();
    
    if (text.toLowerCase() === 'exit' || text.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      return;
    }
    
    if (text) {
      const result = parseTransaction(text);
      console.log('\n< Output JSON:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    promptUser();
  });
}

promptUser();
