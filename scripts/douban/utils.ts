const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";

const TMDB_GENRE_MAPPING: Record<number, string> = {
  12: "冒险",
  14: "奇幻",
  16: "动画",
  18: "剧情",
  27: "恐怖",
  28: "动作",
  35: "喜剧",
  36: "历史",
  37: "西部",
  53: "惊悚",
  80: "犯罪",
  99: "纪录",
  878: "科幻",
  9648: "悬疑",
  10402: "音乐",
  10749: "爱情",
  10751: "家庭",
  10752: "战争",
  10759: "动作冒险",
  10762: "儿童",
  10763: "新闻",
  10764: "真人秀",
  10765: "Sci-Fi & Fantasy",
  10766: "肥皂剧",
  10767: "脱口秀",
  10768: "War & Politics",
  10770: "电视电影",
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

interface TMDBFindResults {
  movie_results: TMDBResult[];
}

interface TMDBResult {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  media_type: string;
  genre_ids: number[];
  release_date: string;
  vote_average: number;
}

interface TMDBSearchResults {
  results: TMDBResult[];
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

async function findTMDBResultsByIMDBId(imdbId: string): Promise<TMDBFindResults> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=zh-CN`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  };
  return (await fetch(url, { headers })).json();
}

async function searchTMDBResults(query: string, year: string): Promise<TMDBSearchResults> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  const url = `https://api.themoviedb.org/3/search/multi?include_adult=false&language=zh-CN&page=1&query=${query}&year=${year}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  };
  return (await fetch(url, { headers })).json();
}

function sleep(second: number) {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

function generateGenreTitle(genreIds: number[]) {
  return genreIds
    .map((id) => TMDB_GENRE_MAPPING[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

function transfromTMDBResult(result: TMDBResult) {
  return {
    id: result.id,
    type: "tmdb",
    title: result.title,
    description: result.overview.trim(),
    releaseDate: result.release_date,
    backdropPath: result.backdrop_path,
    posterPath: result.poster_path,
    rating: result.vote_average,
    mediaType: result.media_type,
    genreTitle: generateGenreTitle(result.genre_ids),
  };
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
    const searchResults = await searchTMDBResults(title, year);
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
