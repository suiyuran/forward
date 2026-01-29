import { writeJsonFile } from "../common.ts";
import { getDoubanDoulistData } from "../douban.ts";
import { sortByReleaseDate, TMDBTransformedResult } from "../tmdb.ts";

const CONFIG = {
  name: "剧场",
  items: [
    {
      name: "爱奇艺·迷雾剧场",
      id: "128396349",
    },
    {
      name: "优酷·白夜剧场",
      id: "158539495",
    },
    {
      name: "芒果·季风剧场",
      id: "153511846",
    },
    {
      name: "腾讯·X剧场",
      id: "155026800",
    },
  ],
  outputPath: "./data/douban/theater.json",
};

async function update() {
  const startTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新开始`);
  const result: Record<string, TMDBTransformedResult[]> = {};

  for (const item of CONFIG.items) {
    console.log(`- ${item.name}`);
    const data = await getDoubanDoulistData(item.id, 0);
    result[item.name] = data.sort(sortByReleaseDate);
  }
  const time = new Date(startTime).toISOString();
  await writeJsonFile(CONFIG.outputPath, { time, data: result });
  const endTime = Date.now();
  console.log(`豆瓣 ${CONFIG.name} 更新完成，耗时 ${(endTime - startTime) / 1000} 秒`);
}

update();
