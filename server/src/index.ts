import app from "./app.js";
import { ENV } from "./config/env.js";
import { connectDb } from "./config/db.js";

async function main() {
  await connectDb();
  app.listen(ENV.PORT, () => {
    console.log(`Server running on http://localhost:${ENV.PORT}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
