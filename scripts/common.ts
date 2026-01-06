export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";
export const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

export const TMDB_GENRE_MAPPING: Record<number, string> = {
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

export interface TMDBTransformedResult {
  id: number;
  type: "tmdb";
  title: string;
  originalTitle: string;
  description: string;
  releaseDate: string;
  backdropPath: string;
  posterPath: string;
  rating: number;
  mediaType: string;
  genreTitle: string;
}

export interface TMDBFindResults {
  movie_results: TMDBResult[];
  tv_results: TMDBResult[];
}

export interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  media_type?: string;
  genre_ids: number[];
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

export interface TMDBSearchResults {
  results: TMDBResult[];
}

export interface TMDBTVSeriesDetails {
  seasons: TMDBTVSeriesDetailsSeason[];
}

export interface TMDBTVSeriesDetailsSeason {
  name: string;
  overview?: string;
  poster_path: string;
  air_date: string;
  vote_average: number;
}

export function sleep(second: number) {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

export function sortByReleaseDate(a: TMDBTransformedResult, b: TMDBTransformedResult) {
  if (!a.releaseDate && !b.releaseDate) return 0;
  if (!a.releaseDate) return -1;
  if (!b.releaseDate) return 1;
  return b.releaseDate.localeCompare(a.releaseDate);
}

export function isAvailableTMDBResult(result: TMDBTransformedResult) {
  return result.id && result.title && result.releaseDate && (result.backdropPath || result.posterPath);
}

export function generateGenreTitle(genreIds: number[]) {
  return genreIds
    .map((id) => TMDB_GENRE_MAPPING[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

export function transformTMDBResult(result: TMDBResult): TMDBTransformedResult {
  return {
    id: result.id,
    type: "tmdb",
    title: result.title || result.name || "",
    originalTitle: result.original_title || result.original_name || "",
    description: (result.overview || "").trim(),
    releaseDate: result.release_date || result.first_air_date || "",
    backdropPath: result.backdrop_path || "",
    posterPath: result.poster_path || "",
    rating: result.vote_average || 0,
    mediaType: result.media_type || "",
    genreTitle: generateGenreTitle(result.genre_ids || []),
  };
}

export async function findTMDBResultsByIMDBIdResponse(imdbId: string): Promise<TMDBFindResults> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&language=zh-CN`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  };
  return (await fetch(url, { headers })).json();
}

export async function findTMDBResultsByIMDBId(imdbId: string) {
  const response = await findTMDBResultsByIMDBIdResponse(imdbId);
  return [...response.movie_results, ...response.tv_results].flatMap(transformTMDBResult);
}

export async function searchTMDBResultsResponse(type: string, query: string, year: string): Promise<TMDBSearchResults> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  const url = `https://api.themoviedb.org/3/search/${type}?include_adult=false&language=zh-CN&page=1&query=${query}&year=${year}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  };
  return (await fetch(url, { headers })).json();
}

export async function searchTMDBResults(type: string, query: string, year: string) {
  const response = await searchTMDBResultsResponse(type, query, year);
  return response.results.map((r) => {
    const result = transformTMDBResult(r);
    if (type === "movie" || type === "tv") {
      result.mediaType = type;
    }
    return result;
  });
}

export async function getTMDBTVSeriesDetailsResponse(id: number): Promise<TMDBTVSeriesDetails> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  const url = `https://api.themoviedb.org/3/tv/${id}?language=zh-CN`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_API_KEY}`,
  };
  return (await fetch(url, { headers })).json();
}

export async function getTMDBTVSeriesDetails(id: number) {
  const response = await getTMDBTVSeriesDetailsResponse(id);
  const seasons = response.seasons.map((season) => ({
    description: (season.overview || "").trim(),
    posterPath: season.poster_path,
    releaseDate: season.air_date,
    rating: season.vote_average,
  }));
  return { seasons };
}
