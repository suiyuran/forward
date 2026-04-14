export function sleep(second: number) {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

export async function writeJsonFile(path: string, data: object) {
  const jsonData = JSON.stringify(data, null, 2);
  await Deno.writeTextFile(path, jsonData + "\n");
}
