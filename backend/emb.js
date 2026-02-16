import { pipeline } from "@xenova/transformers";

async function run() {

  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  const text = "I have fever and headache";

  const result = await extractor(text, {
    pooling: "mean",
    normalize: true
  });

  console.log(result.data);
}

run();
