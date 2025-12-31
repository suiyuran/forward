import { DOMParser } from "@b-fuze/deno-dom";
import { searchTMDBResults, transfromTMDBResult, UA } from "../common.ts";

const TITLE_MAPPING: Record<string, string> = {
  "迪士尼 扭曲仙境": "扭曲仙境",
  "JOCHUM": "ジェオチャム",
};

function handleTitle(title: string) {
  const seasonRegexp =
    /((((3rd|Final) )?(Season|Volume) ?)?([0-9]+)?|[零壹贰叁肆伍陆柒捌玖拾弐]+|(第[零一二三四五六七八九十0-9]+|序|最终)(季|期|部分|クール|シリーズ|章)|Prelude)$/i;
  const specialParts = [
    "TV剪辑版",
    "TV Edition",
    "迷你动画",
    "ミニアニメ",
    "万圣节特别集",
    "Halloween Special",
    "a/",
    "。",
  ];
  const result = specialParts.reduce((acc, part) => acc.replace(part, ""), title.replace(seasonRegexp, "")).trim();
  return TITLE_MAPPING[result] || result;
}

async function main() {
  const startTime = Date.now();
  console.log(`Bangumi 每日放送 更新开始`);

  const domParser = new DOMParser();
  const url = "https://bangumi.tv/calendar";
  const headers = { "User-Agent": UA };
  const response = await fetch(url, { headers });
  const text = await response.text();
  const doc = domParser.parseFromString(text, "text/html");
  const weekElements = doc.querySelectorAll("li.week");
  const calendar: Record<string, Record<string, unknown>[]> = {};

  for (const weekElement of weekElements) {
    const dayElement = weekElement.querySelector("h3");

    if (dayElement) {
      const day = dayElement.textContent.trim();
      calendar[day] = [];
      const names: string[] = [];
      console.log(`- ${day}`);

      const items = weekElement.querySelectorAll(".info");

      for (const item of items) {
        const titleElement = item.querySelector("p:first-child>a");

        if (!titleElement) {
          continue;
        }
        const title = titleElement.textContent.trim();

        if (!title) {
          continue;
        }
        console.log(`  - 动画: ${title}`);
        const originalTitleElement = item.querySelector("small>em");

        if (!originalTitleElement) {
          continue;
        }
        const originalTitle = originalTitleElement.textContent.trim();
        console.log(`    动画原名: ${originalTitle}`);
        const name = handleTitle(title);
        console.log(`    剧集: ${name}`);
        const originalName = handleTitle(originalTitle);
        console.log(`    剧集原名: ${originalName}`);

        if (names.includes(name)) {
          console.log(`    已处理过该剧集，跳过`);
          continue;
        }
        names.push(name);
        const nameResponse = await searchTMDBResults("tv", name, "");
        const originalNameResponse = await searchTMDBResults("tv", originalName, "");
        const results = [nameResponse, originalNameResponse].map((res) => res.results).flat();
        const result = results.find((res) => {
          const resTitle = res.name || "";
          const resName = handleTitle(resTitle);
          const resOriginalTitle = res.original_name;
          const resOriginalName = handleTitle(res.original_name);
          return (
            resTitle === name ||
            resOriginalTitle === originalName ||
            resTitle.toLowerCase() === name.toLowerCase() ||
            resOriginalTitle.toLowerCase() === originalName.toLowerCase() ||
            resName === name ||
            resOriginalName === originalName ||
            resName.toLowerCase() === name.toLowerCase() ||
            resOriginalName.toLowerCase() === originalName.toLowerCase()
          );
        });

        if (result) {
          const series = transfromTMDBResult(result);
          console.log(`    TMDB ID: ${series.id}`);

          if (series.id && (series.posterPath || series.backdropPath)) {
            series.mediaType = "tv";
            calendar[day].push(series);
            continue;
          }
        }
        console.log(`    未找到匹配的 TMDB 结果`);
      }
    }
  }

  const time = new Date(startTime).toISOString();
  const jsonData = JSON.stringify({ time, data: calendar }, null, 2);

  await Deno.writeTextFile("./data/bangumi/calendar.json", jsonData + "\n");

  const endTime = Date.now();
  console.log(`Bangumi 每日放送 更新完成，耗时 ${(endTime - startTime) / 1000} 秒`);
}

main();
