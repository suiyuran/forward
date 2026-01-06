import { DOMParser } from "@b-fuze/deno-dom";
import { isAvailableTMDBResult, searchTMDBResults, TMDBTransformedResult, UA } from "../common.ts";

const TITLE_MAPPING: Record<string, string> = {
  "我们不可能成为恋人！绝对不行。 (※似乎可行？) 〜再次闪耀！〜": "我们不可能成为恋人！绝对不行。(※似乎可行！？)",
  "公主大人“拷问”的时间到了": "公主殿下，“拷问”的时间到了",
  "异世界的安泰全看社畜": "异世界的处置依社畜而定",
  "地狱老师": "新·地狱老师",
  "学园偶像大师 Story of Re;IRIS": "学園アイドルマスター Story of Re;IRIS",
  "Fate/strange Fake": "命运／奇异赝品",
  "判处勇者刑 惩罚勇者9004队刑务纪录": "判处勇者刑 刑罚勇者9004队服刑记录",
  "终究、与你相恋。": "终究，与你相恋。",
  "蘑菇魔女": "毒菇魔女",
};
const ORIGINAL_TITLE_MAPPING: Record<string, string> = {
  "ONE PIECE": "ワンピース",
  "わたしが恋人になれるわけないじゃん、ムリムリ!（※ムリじゃなかった!?）〜ネクストシャイン！〜":
    "わたしが恋人になれるわけないじゃん、ムリムリ！（※ムリじゃなかった!?）",
  "ヘルモード ～やり込み好きのゲーマーは廃設定の異世界で無双する～":
    "ヘルモード ～やり込み好きのゲーマーは廃設定の異世界で無双する～ はじまりの召喚士",
  "DARK MOON -黒の月: 月の祭壇-": "DARK MOON　-黒の月: 月の祭壇-",
  "お気楽領主の楽しい領地防衛～生産系魔術で名もなき村を最強の城塞都市に～":
    "お気楽領主の楽しい領地防衛 ～生産系魔術で名もなき村を最強の城塞都市に～",
  "転生したらドラゴンの卵だった": "転生したらドラゴンの卵だった～最強以外目指さねぇ～",
};
const SEASON_REGEXP =
  /(?<!^)((((3rd|Final) )?(Season|Volume) ?[0-9]*|Prelude)|(第?([0-9]|[零一二三四五六七八九十]|[零壹贰叁肆伍陆柒捌玖拾]|[弐参])+|序|前|最(终|終))((季|期)|(部分|クール)|(之|ノ)?章|シリーズ|(篇|編))|[0-9]+$)/gi;
const SPECIAL_PARTS = ["TV剪辑版", "TV Edition", "迷你动画", "ミニアニメ", "万圣节特别集", "Halloween Special"];

function handleTitle(title: string) {
  const result = SPECIAL_PARTS.reduce((acc, part) => acc.replace(part, ""), title.replaceAll(SEASON_REGEXP, "")).trim();
  return TITLE_MAPPING[result] || result;
}

function handleOriginalTitle(title: string) {
  const result = SPECIAL_PARTS.reduce((acc, part) => acc.replace(part, ""), title.replaceAll(SEASON_REGEXP, "")).trim();
  return ORIGINAL_TITLE_MAPPING[result] || result;
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
  const calendar: Record<string, TMDBTransformedResult[]> = {};

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
        const originalName = handleOriginalTitle(originalTitle);
        console.log(`    剧集原名: ${originalName}`);

        if (names.includes(name)) {
          console.log(`    已处理过该剧集，跳过`);
          continue;
        }
        names.push(name);
        const nameResponse = await searchTMDBResults("tv", name, "");
        const originalNameResponse = await searchTMDBResults("tv", originalName, "");
        const results = [...nameResponse, ...originalNameResponse];
        const result = results.find((res) => {
          return res.title === name && res.originalTitle === originalName;
        });

        if (result) {
          console.log(`    TMDB ID: ${result.id}`);

          if (isAvailableTMDBResult(result)) {
            result.mediaType = "tv";
            calendar[day].push(result);
          } else {
            console.log(`    TMDB 结果缺少必要信息，跳过`);
          }
          continue;
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
