import { writeJsonFile } from "../common.ts";
import { getDoubanSubjectCollectionData } from "../douban.ts";
import { TMDBTransformedResult } from "../tmdb.ts";

const CONFIG = {
  name: "周榜",
  items: [
    {
      name: "电影",
      subject: "movie_weekly_best",
      start: 0,
      count: 10,
    },
    {
      name: "剧集·国内",
      subject: "tv_chinese_best_weekly",
      start: 0,
      count: 10,
    },
    {
      name: "剧集·国外",
      subject: "tv_global_best_weekly",
      start: 0,
      count: 10,
    },
  ],
  outputPath: "./data/douban/weekly.json",
};

async function update() {
  const startTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新开始`);
  const data: Record<string, TMDBTransformedResult[]> = {};

  for (const item of CONFIG.items) {
    console.log(`- ${item.name}`);
    const itemData = await getDoubanSubjectCollectionData(item.subject, item.start, item.count);
    data[item.name] = itemData;
  }
  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  if (Object.values(data).some((item) => item.length === 0)) {
    console.log(`豆瓣 ${CONFIG.name} 更新失败，耗时 ${seconds} 秒`);
    return;
  }
  const time = new Date(startTime).toISOString();
  await writeJsonFile(CONFIG.outputPath, { time, data });
  console.log(`豆瓣 ${CONFIG.name} 更新完成，耗时 ${seconds} 秒`);
}

update();
