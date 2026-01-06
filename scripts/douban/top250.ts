import { getDoubanSubjectCollectionData } from "./utils.ts";

const CONFIG = {
  name: "Top250",
  subject: "movie_top250",
  start: 0,
  count: 250,
  outputPath: "./data/douban/top250.json",
};

async function update() {
  const startTime = Date.now();
  console.log(`豆瓣电影 ${CONFIG.name} 更新开始`);

  const data = await getDoubanSubjectCollectionData(CONFIG.subject, CONFIG.start, CONFIG.count);
  const time = new Date(startTime).toISOString();
  const jsonData = JSON.stringify({ time, data }, null, 2);

  await Deno.writeTextFile(CONFIG.outputPath, jsonData + "\n");

  const endTime = Date.now();
  console.log(`豆瓣电影 ${CONFIG.name} 更新完成，耗时 ${(endTime - startTime) / 1000} 秒`);
}

update();
