import { loadState } from './src/server/mongo.js';

async function checkUsers() {
  const data = await loadState('main_db', {});
  console.log("Users in DB:", data.users?.map(u => u.email) || []);
  process.exit(0);
}
checkUsers();
