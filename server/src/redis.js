import { createClient } from "redis";

export function makeRedisClient(url) {
  const client = createClient({ url });

  client.on("error", (err) => {
    console.error("[redis] error", err);
  });

  return client;
}