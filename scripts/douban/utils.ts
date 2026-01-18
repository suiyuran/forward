import { DOMParser } from "@b-fuze/deno-dom";
import {
  findTMDBResultsByIMDBId,
  getTMDBTVSeriesDetails,
  isAvailableTMDBResult,
  MOBILE_UA,
  searchTMDBResults,
  sleep,
} from "../common.ts";

const TITLE_RECORD: Record<string, string> = {
  破茧2: "tt13364912",
};

interface DoubanSubjectCollection {
  count: number;
  subject_collection_items: DoubanSubjectCollectionItem[];
  total: number;
  start: number;
}

interface DoubanSubjectCollectionItem {
  id: string;
  title: string;
  type: string;
  card_subtitle: string;
  actors?: string[];
  year?: string;
  release_date?: string;
}

async function getDoubanSubjectCollectionResponse(
  subject: string,
  start: number,
  count: number,
): Promise<DoubanSubjectCollection> {
  const api = `https://m.douban.com/rexxar/api/v2/subject_collection/${subject}/items`;
  const query = `start=${start}&count=${count}&items_only=1&type_tag=&for_mobile=1`;
  const url = `${api}?${query}`;
  const headers = {
    "User-Agent": MOBILE_UA,
    "Referer": "https://m.douban.com/movie/",
  };
  return (await fetch(url, { headers })).json();
}

async function getDoubanSubjectCollection(subject: string, start: number, count: number) {
  const response = await getDoubanSubjectCollectionResponse(subject, start, count);
  const items = response.subject_collection_items;
  const total = response.total;

  if (start + count < total) {
    const nextItems = await getDoubanSubjectCollection(subject, start + count, count);
    items.push(...nextItems);
  }
  return items;
}

async function getDoubanMovieDescResponse(id: string) {
  const url = `https://www.douban.com/doubanapp/h5/movie/${id}/desc`;
  const headers = {
    "User-Agent": MOBILE_UA,
    "Referer": `https://m.douban.com/movie/subject/${id}/`,
  };
  return (await fetch(url, { headers })).text();
}

async function getDoubanMovieIMDBId(id: string) {
  return (await getDoubanMovieDescResponse(id)).match(/(tt\d+)/)?.[1] || "";
}

async function getDoubanDoulistResponse(id: string, start: number) {
  const url = `https://m.douban.com/doulist/${id}/?start=${start}`;
  const headers = { "User-Agent": MOBILE_UA };
  return (await fetch(url, { headers })).text();
}

export async function getDoubanDoulist(domParser: DOMParser, id: string, start: number) {
  const response = await getDoubanDoulistResponse(id, start);
  const doc = domParser.parseFromString(response, "text/html");
  const list = Array.from(doc.querySelectorAll(".doulist-items li"));
  const nextButton = doc.querySelector(".button.next");

  if (nextButton) {
    const href = nextButton.getAttribute("href") || "";

    if (href && href.includes("?start=")) {
      const startMatch = href.match(/start=(\d+)/);

      if (startMatch) {
        const nextStart = parseInt(startMatch[1], 10);
        const nextList = await getDoubanDoulist(domParser, id, nextStart);
        list.push(...nextList);
      }
    }
  }
  return list;
}

export async function getDoubanSubjectCollectionData(subject: string, start: number, count: number) {
  const items = await getDoubanSubjectCollection(subject, start, count);
  const results = [];

  for (const item of items) {
    const { id, title, type, card_subtitle: cardSubtitle } = item;
    const infos = cardSubtitle.split("/").map((info) => info.trim());
    const year = item.year || infos[0];

    console.log(`  - 电影: ${title} (${year})`);
    await sleep(5);
    console.log(`    豆瓣 ID: ${id}`);
    const imdbId = TITLE_RECORD[title] || (await getDoubanMovieIMDBId(id));
    console.log(`    IMDB ID: ${imdbId}`);

    if (imdbId) {
      const findResults = await findTMDBResultsByIMDBId(imdbId);

      if (findResults.length > 0) {
        const findResult = findResults[0];
        console.log(`    TMDB ID: ${findResult.id}`);

        if (isAvailableTMDBResult(findResult)) {
          results.push(findResult);
        } else {
          console.log(`    TMDB 结果缺少必要信息，跳过`);
        }
        continue;
      }
    }

    const releaseDate = item.release_date ? `${year}-${item.release_date.replace(".", "-")}` : "";
    const actors =
      item.actors ||
      infos
        .slice(-1)[0]
        .split(" ")
        .map((actor) => actor.trim());
    const searchResults = await searchTMDBResults("multi", title, year);
    const searchResult = searchResults.find(
      (result) =>
        result.title === title &&
        result.mediaType === type &&
        (result.releaseDate === releaseDate || actors.some((actor) => result.description.includes(actor))),
    );

    if (searchResult) {
      console.log(`    TMDB ID: ${searchResult.id}`);

      if (isAvailableTMDBResult(searchResult)) {
        results.push(searchResult);
      } else {
        console.log(`    TMDB 结果缺少必要信息，跳过`);
      }
      continue;
    }
    console.log(`    未找到匹配的 TMDB 结果`);
  }
  return results;
}

export async function getDoubanDoulistData(id: string, start: number) {
  const domParser = new DOMParser();
  const list = await getDoubanDoulist(domParser, id, start);
  const results = [];

  for (const item of list) {
    const hrefElement = item.querySelector("a");
    const href = hrefElement?.getAttribute("href") || "";
    const id = href.split("/").filter(Boolean).pop() || "";
    const titleElement = item.querySelector("h2");
    const title = titleElement?.textContent.trim() || "";
    const metaElement = item.querySelector(".meta");
    const meta = metaElement?.textContent.trim() || "";
    const year = meta.match(/(\d{4})/)?.[1] || "";
    const month = meta.match(/-(\d{2})/)?.[1] || "";
    const releaseDate = meta.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "";

    console.log(`  - ${title} (${releaseDate || year})`);
    await sleep(5);
    console.log(`    豆瓣 ID: ${id}`);
    const imdbId = TITLE_RECORD[title] || (await getDoubanMovieIMDBId(id));
    console.log(`    IMDB ID: ${imdbId}`);

    if (imdbId) {
      const findResults = await findTMDBResultsByIMDBId(imdbId);

      if (findResults.length > 0) {
        const findResult = findResults[0];
        console.log(`    TMDB ID: ${findResult.id}`);

        if (isAvailableTMDBResult(findResult)) {
          results.push(findResult);
        } else {
          console.log(`    TMDB 结果缺少必要信息，跳过`);
        }
        continue;
      }
    }

    const searchResults = await searchTMDBResults("multi", title, year);
    const searchResult = searchResults.find((result) => result.title === title && result.releaseDate === releaseDate);

    if (searchResult) {
      console.log(`    TMDB ID: ${searchResult.id}`);

      if (isAvailableTMDBResult(searchResult)) {
        results.push(searchResult);
      } else {
        console.log(`    TMDB 结果缺少必要信息，跳过`);
      }
      continue;
    }
    if (searchResults.length === 1) {
      const onlyResult = searchResults[0];

      if (onlyResult.mediaType === "tv") {
        if (onlyResult.title === title && onlyResult.releaseDate.startsWith(`${year}-${month}`)) {
          console.log(`    TMDB ID: ${onlyResult.id}`);

          if (isAvailableTMDBResult(onlyResult)) {
            results.push(onlyResult);
          } else {
            console.log(`    TMDB 结果缺少必要信息，跳过`);
          }
          continue;
        }
        const details = await getTMDBTVSeriesDetails(onlyResult.id);
        const season = details.seasons.find((s) => s.releaseDate === releaseDate);

        if (season) {
          console.log(`    TMDB ID: ${onlyResult.id}`);
          const seasonResult = { ...onlyResult, title, ...season };

          if (isAvailableTMDBResult(seasonResult)) {
            results.push(seasonResult);
          } else {
            console.log(`    TMDB 结果缺少必要信息，跳过`);
          }
          continue;
        }
      }
    }
    console.log(`    未找到匹配的 TMDB 结果`);
  }
  return results;
}
