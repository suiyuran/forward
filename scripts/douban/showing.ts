import { writeJsonFile } from "../common.ts";
import { getDoubanSubjectCollectionData } from "../douban.ts";

const CONFIG = {
  name: "正在上映",
  subject: "movie_showing",
  start: 0,
  count: 50,
  outputPath: "./data/douban/showing.json",
};

async function update() {
  const startTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新开始`);
  const data = await getDoubanSubjectCollectionData(CONFIG.subject, CONFIG.start, CONFIG.count);
  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  if (data.length === 0) {
    console.log(`豆瓣 ${CONFIG.name} 更新失败，耗时 ${seconds} 秒`);
    return;
  }
  const time = new Date(startTime).toISOString();
  await writeJsonFile(CONFIG.outputPath, { time, data });
  console.log(`豆瓣 ${CONFIG.name} 更新完成，耗时 ${seconds} 秒`);
}

update();
