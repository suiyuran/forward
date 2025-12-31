import { findTMDBResultsByIMDBId, searchTMDBResults, sleep, transfromTMDBResult, UA } from "../common.ts";

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

interface DoubanUpdateJob {
  name: string;
  subject: string;
  start: number;
  count: number;
  outputPath: string;
}

async function getDoubanSubjectCollection(
  subject: string,
  start: number,
  count: number,
): Promise<DoubanSubjectCollection> {
  const api = `https://m.douban.com/rexxar/api/v2/subject_collection/${subject}/items`;
  const query = `?start=${start}&count=${count}&items_only=1&type_tag=&for_mobile=1`;
  const url = `${api}?${query}`;
  const headers = {
    "User-Agent": UA,
    "Referer": "https://m.douban.com/movie/",
  };
  return (await fetch(url, { headers })).json();
}

async function getDoubanMovieIMDBId(id: string) {
  const url = `https://www.douban.com/doubanapp/h5/movie/${id}/desc`;
  const headers = {
    "User-Agent": UA,
    "Referer": `https://m.douban.com/movie/subject/${id}/`,
  };
  const response = await fetch(url, { headers });
  return (await response.text()).match(/(tt\d+)/)?.[1] || "";
}

export async function runUpdateJob(job: DoubanUpdateJob) {
  const { name, subject, start, count, outputPath } = job;
  const startTime = Date.now();
  console.log(`豆瓣电影 ${name} 更新开始`);

  const collection = await getDoubanSubjectCollection(subject, start, count);
  const items = collection.subject_collection_items;
  const results = [];

  for (const item of items) {
    const { id, title, type, card_subtitle: cardSubtitle } = item;
    const infos = cardSubtitle.split("/").map((info) => info.trim());
    const year = item.year || infos[0];

    console.log(`  - 电影: ${title} (${year})`);
    await sleep(5);
    console.log(`    豆瓣 ID: ${id}`);
    const imdbId = await getDoubanMovieIMDBId(id);
    console.log(`    IMDB ID: ${imdbId}`);

    if (imdbId) {
      const findResults = await findTMDBResultsByIMDBId(imdbId);

      if (findResults.movie_results.length > 0) {
        const findResult = findResults.movie_results[0];
        console.log(`    TMDB ID: ${findResult.id}`);
        results.push(findResult);
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
    const searchResult = searchResults.results.find(
      (result) =>
        result.title === title &&
        result.media_type === type &&
        (result.release_date === releaseDate || actors.some((actor) => result.overview.includes(actor))),
    );

    if (searchResult) {
      console.log(`    TMDB ID: ${searchResult.id}`);
      results.push(searchResult);
    } else {
      console.log(`    未找到匹配的 TMDB 结果`);
    }
  }
  const time = new Date(startTime).toISOString();
  const data = results.map((result) => transfromTMDBResult(result));
  const jsonData = JSON.stringify({ time, data }, null, 2);

  await Deno.writeTextFile(outputPath, jsonData + "\n");

  const endTime = Date.now();
  console.log(`豆瓣电影 ${name} 更新完成，耗时 ${(endTime - startTime) / 1000} 秒`);
}
