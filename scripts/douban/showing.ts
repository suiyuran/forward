import { getDoubanSubjectCollectionData } from "./utils.ts";

const CONFIG = {
  name: "正在上映",
  subject: "movie_showing",
  start: 0,
  count: 50,
  outputPath: "./data/douban/showing.json",
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
