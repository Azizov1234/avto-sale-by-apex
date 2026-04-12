import { build } from 'vite';

async function run() {
  try {
    await build()
  } catch (e) {
    console.error('--- ERROR CAUGHT ---');
    console.error(e.message);
    if (e.errors) console.error(e.errors);
  }
}
run();
