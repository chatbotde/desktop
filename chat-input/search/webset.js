import * as dotenv from "dotenv";
import Exa, { CreateWebsetParameters, CreateEnrichmentParameters } from "exa-js";

// Load environment variables
dotenv.config();

async function main() {
  const exa = new Exa(process.env.VITE_EXA_API_KEY);

  try {
    // Create a Webset with search and enrichments
    const webset = await exa.websets.create({
      search: {
        query: "Top AI research labs focusing on large language models",
        count: 10
      },
      enrichments: [
        {
          description: "Estimate the company'\''s founding year",
          format: "number"
        }
      ],
    });

    console.log(`Webset created with ID: ${webset.id}`);

    // Wait until Webset completes processing
    const idleWebset = await exa.websets.waitUntilIdle(webset.id, {
      timeout: 60000,
      pollInterval: 2000,
      onPoll: (status) => console.log(`Current status: ${status}...`)
    });

    // Retrieve Webset Items
    const items = await exa.websets.items.list(webset.id, { limit: 10 });
    for (const item of items.data) {
      console.log(`Item: ${JSON.stringify(item, null, 2)}`);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();