const endpoint = process.env.SEARCH_ENDPOINT || "http://localhost:3000/search";
const startupDelayMs = Number(process.env.TRAFFIC_STARTUP_DELAY_MS || 5000);
const retries = Number(process.env.TRAFFIC_HEALTH_RETRIES || 30);

const samples = [
  {
    text: "abracadabra ".repeat(2000),
    pattern: "abra",
    algorithm: "all"
  },
  {
    text: "ACGTGATTACATTTACG".repeat(3000),
    pattern: "GATTACA",
    algorithm: "all"
  },
  {
    text: "the quick brown fox jumps over the lazy dog ".repeat(2500),
    pattern: "the",
    algorithm: "all"
  },
  {
    text: "lorem ipsum dolor sit amet ".repeat(3000),
    pattern: "zzzzzz",
    algorithm: "all"
  }
];

const rounds = Number(process.env.TRAFFIC_ROUNDS || 20);

await waitForBackend();

for (let i = 0; i < rounds; i++) {
  const sample = samples[i % samples.length];
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sample, source: "traffic-generator" })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} em ${endpoint}`);
  }

  const payload = await response.json();
  console.log(`${i + 1}/${rounds} trace=${payload.traceId} algorithms=${payload.results.length}`);
}

async function waitForBackend() {
  const healthEndpoint = endpoint.replace(/\/search$/, "/health");
  await sleep(startupDelayMs);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(healthEndpoint);
      if (response.ok) return;
    } catch {
      // backend ainda inicializando
    }
    console.log(`aguardando backend (${attempt}/${retries})...`);
    await sleep(2000);
  }

  throw new Error(`Backend nao ficou saudavel em ${healthEndpoint}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
