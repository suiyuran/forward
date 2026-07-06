import { DOMParser } from "@b-fuze/deno-dom";
import { writeJsonFile } from "../../src/common.ts";
import { UA } from "../../src/constants.ts";
import {
  findTMDBResultsByIMDBId,
  isAvailableTMDBResult,
  searchTMDBResults,
  sortById,
  TMDBTransformedResult,
} from "../../src/tmdb.ts";

const CONFIG = {
  name: "每日放送",
  outputPath: "./data/bangumi/calendar.json",
};
const SEASON_REGEXP =
  /(?<!^)((((Second|2nd|3rd|4rd|4th|Final) )?(Season|Volume|シーズン) ?[0-9]*|Prelude)|(第?(?:[0-9]|[零一二三四五六七八九十]|[零壹贰叁肆伍陆柒捌玖拾]|[弐参])+|序|前|最(?:终|終))((?:季|期)|(?:部分|クール)|(?:之|ノ)?章|シリーズ|(?:篇|編))|[0-9]+$)/gi;
const SPECIAL_PARTS = [
  "TV剪辑版",
  "TV Edition",
  "迷你动画",
  "ミニアニメ",
  "万圣节特别集",
  "Halloween Special",
  "〜再次闪耀！〜",
  "〜ネクストシャイン！〜",
  "幻真星戦編",
  "幻真星戦編",
  "act2",
  "actⅡ",
  "埃鲁巴夫篇",
  "エルバフ編",
  "丧失篇",
  "喪失編",
  "～到了异世界就拿出真本事～",
  "～異世界行ったら本気だす～",
  "学长驾到请指教",
  "10周年纪念特别篇",
  "あっとほーむぱーてぃー",
  "特别篇 阳极天下",
  "大明皇朝篇",
  "试播片",
  "Pilot Film",
  "完结季",
];
const TITLE_RECORD: Record<string, string> = {
  航海王: "tt0388629",
};

function handleTitle(title: string) {
  // 1. remove season-like suffixes (e.g. "第11季")
  const withoutSeason = title.replaceAll(SEASON_REGEXP, "");
  // 2. remove known special parts
  const withoutSpecial = SPECIAL_PARTS.reduce((acc, part) => acc.replaceAll(part, ""), withoutSeason);
  // 3. remove Unicode Roman numerals (e.g. ⅠⅡⅢ)
  let s = withoutSpecial.replace(/[\u2160-\u216F\u2170-\u217F]+/gu, "");
  // 4. remove trailing bracketed numerals like " (2)" or "（２）"
  s = s.replace(/[\s(\[（]+[0-9０-９]+[)\]）]+$/u, "");
  // 5. remove trailing standalone digits (ASCII and fullwidth), possibly preceded by separators
  s = s.replace(/(?:[\s\-–—:：·・_]+)?[0-9０-９]+$/u, "");
  // 6. remove trailing part indicators like "上", "下", "上篇", "下篇", etc.
  s = s.replace(/\s*(?:上|下|上部|下部|上篇|下篇|前篇|后篇|後編|前編|下編|上編|下集)$/u, "");
  return s.trim();
}

function isAnime(result: TMDBTransformedResult) {
  return result.genreTitle.includes("动画");
}

async function main() {
  const startTime = Date.now();
  const year = new Date(startTime).getFullYear().toString();
  console.log(`Bangumi ${CONFIG.name} 更新开始`);
  const domParser = new DOMParser();
  const url = "https://bangumi.tv/calendar";
  const headers = { "User-Agent": UA };
  const response = await fetch(url, { headers });
  const text = await response.text();
  const doc = domParser.parseFromString(text, "text/html");
  const weekElements = doc.querySelectorAll("li.week");
  const data: Record<string, TMDBTransformedResult[]> = {};

  for (const weekElement of weekElements) {
    const dayElement = weekElement.querySelector("h3");

    if (dayElement) {
      const day = dayElement.textContent.trim();
      data[day] = [];
      console.log(`- ${day}`);
      const items = weekElement.querySelectorAll(".info");

      for (const item of items) {
        const title = item.querySelector("p:first-child>a")?.textContent.trim() || "";
        const originalTitle = item.querySelector("small>em")?.textContent.trim() || "";

        if (!title || !originalTitle) {
          continue;
        }
        const name = handleTitle(title);
        const originalName = handleTitle(originalTitle);
        console.log(`  - 动画: ${title}`);
        console.log(`    动画原名: ${originalTitle}`);
        console.log(`    剧集: ${name}`);
        console.log(`    剧集原名: ${originalName}`);

        if (name in TITLE_RECORD) {
          const imdbId = TITLE_RECORD[name];
          const findResults = await findTMDBResultsByIMDBId(imdbId, "tv");

          if (findResults.length > 0) {
            const findResult = findResults[0];
            console.log(`    TMDB ID: ${findResult.id}`);

            if (findResult && isAvailableTMDBResult(findResult)) {
              data[day].push(findResult);
            } else {
              console.log("    TMDB 结果缺少必要信息，跳过");
            }
            continue;
          }
        }
        const tvResults = await searchTMDBResults("tv", originalName, year);
        let availableResults = tvResults.filter(isAvailableTMDBResult);

        if (availableResults.length === 0) {
          const movieResults = await searchTMDBResults("movie", originalName, year);
          availableResults = movieResults.filter(isAvailableTMDBResult);
        }
        if (availableResults.length === 1) {
          const onlyResult = availableResults[0];
          console.log(`    TMDB ID: ${onlyResult.id}`);
          data[day].push(onlyResult);
          continue;
        }
        if (availableResults.length > 1) {
          const sortedResults = availableResults.filter(isAnime).sort(sortById);
          const firstResult = sortedResults[0];
          console.log(`    TMDB ID: ${firstResult.id}`);
          data[day].push(firstResult);
          continue;
        }
        console.log("    未找到匹配的 TMDB 结果");
      }
    }
  }
  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  if (Object.values(data).some((item) => item.length === 0)) {
    console.log(`Bangumi ${CONFIG.name} 更新失败，耗时 ${seconds} 秒`);
    return;
  }
  const time = new Date(startTime).toISOString();
  await writeJsonFile(CONFIG.outputPath, { time, data });
  console.log(`Bangumi ${CONFIG.name} 更新完成，耗时 ${seconds} 秒`);
}

main();
