import { DOMParser } from "@b-fuze/deno-dom";
import { MOBILE_UA, sleep } from "./common.ts";
import { findTMDBResultsByIMDBId, getTMDBTVSeriesDetails, isAvailableTMDBResult, searchTMDBResults } from "./tmdb.ts";

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

async function getDoubanMovieDesc(id: string) {
  const response = await getDoubanMovieDescResponse(id);
  const releaseDate = response.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "";
  const imdbId = response.match(/(tt\d+)/)?.[1] || "";
  return { releaseDate, imdbId };
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

export async function getDoubanMatchedTMDBResult(
  id: string,
  title: string,
  type: string,
  year: string,
  releaseDate?: string,
) {
  const typeName = type === "movie" ? "电影" : "剧集";
  console.log(`  - ${typeName}: ${title} (${year})`);
  await sleep(5);
  console.log(`    豆瓣 ID: ${id}`);
  const desc = await getDoubanMovieDesc(id);
  const imdbId = desc.imdbId;
  releaseDate = releaseDate || desc.releaseDate;
  console.log(`    IMDB ID: ${desc.imdbId}`);

  if (imdbId) {
    const findResults = await findTMDBResultsByIMDBId(imdbId, type);

    if (findResults.length > 0) {
      const findResult = findResults[0];
      console.log(`    TMDB ID: ${findResult.id}`);
      return findResult;
    }
  }

  if (type === "movie" || (type === "tv" && !title.match(/(\d{1})$/))) {
    const searchResults = await searchTMDBResults(type, title, year);
    const searchResult = searchResults.find((result) => result.title === title && result.releaseDate === releaseDate);

    if (searchResult) {
      console.log(`    TMDB ID: ${searchResult.id}`);
      return searchResult;
    }
    if (searchResults.length === 1) {
      const onlyResult = searchResults[0];

      if (onlyResult.title === title && onlyResult.releaseDate.startsWith(year)) {
        console.log(`    TMDB ID: ${onlyResult.id}`);
        return onlyResult;
      }
      const details = await getTMDBTVSeriesDetails(onlyResult.id);
      const season = details.seasons.find((s) => s.releaseDate === releaseDate);

      if (season) {
        console.log(`    TMDB ID: ${onlyResult.id}`);
        const { seasonNumber: _, ...seasonWithoutNumber } = season;
        return { ...onlyResult, ...seasonWithoutNumber };
      }
    }
  } else {
    const titleLength = title.length;
    const seriesTitle = title.slice(0, titleLength - 1);
    const seasonNumber = parseInt(title.slice(titleLength - 1), 10);
    const searchResults = await searchTMDBResults("tv", seriesTitle, year);
    const searchResult = searchResults.find((result) => result.title === seriesTitle);

    if (searchResult) {
      const details = await getTMDBTVSeriesDetails(searchResult.id);
      const season = details.seasons.find((s) => s.seasonNumber === seasonNumber && s.releaseDate === releaseDate);

      if (season) {
        console.log(`    TMDB ID: ${searchResult.id}`);
        const { seasonNumber: _, ...seasonWithoutNumber } = season;
        return { ...searchResult, ...seasonWithoutNumber };
      }
    }
  }
  return null;
}

export async function getDoubanSubjectCollectionData(subject: string, start: number, count: number) {
  const items = await getDoubanSubjectCollection(subject, start, count);
  const results = [];

  for (const item of items) {
    const { id, title, type, card_subtitle: cardSubtitle } = item;
    const infos = cardSubtitle.split("/").map((info) => info.trim());
    const year = item.year || infos[0];
    const releaseDate = item.release_date ? `${year}-${item.release_date.replace(".", "-")}` : "";
    const result = await getDoubanMatchedTMDBResult(id, title, type, year, releaseDate);

    if (!result) {
      console.log("    未找到匹配的 TMDB 结果");
      continue;
    }
    if (isAvailableTMDBResult(result)) {
      results.push(result);
    } else {
      console.log("    TMDB 结果缺少必要信息，跳过");
    }
  }
  return results;
}

export async function getDoubanDoulistData(id: string, start: number) {
  const domParser = new DOMParser();
  const list = await getDoubanDoulist(domParser, id, start);
  const results = [];

  for (const item of list) {
    const href = item.querySelector("a")?.getAttribute("href") || "";
    const id = href.split("/").filter(Boolean).pop() || "";
    const title = item.querySelector("h2")?.textContent.trim() || "";
    const meta = item.querySelector(".meta")?.textContent.trim() || "";
    const year = meta.match(/(\d{4})/)?.[1] || "";
    const releaseDate = meta.match(/(\d{4}-\d{2}-\d{2})/)?.[1] || "";
    const result = await getDoubanMatchedTMDBResult(id, title, "tv", year, releaseDate);

    if (!result) {
      console.log("    未找到匹配的 TMDB 结果");
      continue;
    }
    if (isAvailableTMDBResult(result)) {
      results.push(result);
    } else {
      console.log("    TMDB 结果缺少必要信息，跳过");
    }
  }
  return results;
}
