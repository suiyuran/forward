import { writeJsonFile } from "../common.ts";
import { getDoubanSubjectCollectionData } from "../douban.ts";

const CONFIG = {
  name: "Top250",
  subject: "movie_top250",
  start: 0,
  count: 250,
  outputPath: "./data/douban/top250.json",
};

async function update() {
  const startTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新开始`);
  const data = await getDoubanSubjectCollectionData(CONFIG.subject, CONFIG.start, CONFIG.count);
  const time = new Date(startTime).toISOString();
  await writeJsonFile(CONFIG.outputPath, { time, data });
  const endTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新完成，耗时 ${(endTime - startTime) / 1000} 秒`);
}

update();
