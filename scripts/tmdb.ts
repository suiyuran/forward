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
  tv_episode_results: TMDBEpisodeResult[];
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
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

export interface TMDBEpisodeResult {
  show_id: number;
  season_number: number;
}

export interface TMDBSearchResults {
  results: TMDBResult[];
}

export interface TMDBTVSeriesDetails extends TMDBResult {
  seasons: TMDBTVSeriesDetailsSeason[];
}

export interface TMDBTVSeriesDetailsSeason {
  overview?: string;
  air_date: string;
  season_number: number;
  vote_average: number;
}

export function sortByReleaseDate(a: TMDBTransformedResult, b: TMDBTransformedResult) {
  if (!a.releaseDate && !b.releaseDate) return 0;
  if (!a.releaseDate) return -1;
  if (!b.releaseDate) return 1;
  return b.releaseDate.localeCompare(a.releaseDate);
}

export function isAvailableTMDBResult(result: TMDBTransformedResult) {
  return result.id && result.title && result.releaseDate && result.posterPath;
}

export function generateGenreTitle(genreIds: number[]) {
  return genreIds
    .map((id) => TMDB_GENRE_MAPPING[id])
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

export function transformTMDBResult(result: TMDBResult): TMDBTransformedResult {
  const genreIds = result.genre_ids || result.genres?.map((g) => g.id) || [];
  return {
    id: result.id,
    type: "tmdb",
    title: result.title || result.name || "",
    originalTitle: result.original_title || result.original_name || "",
    description: (result.overview || "").trim(),
    releaseDate: result.release_date || result.first_air_date || "",
    backdropPath: result.backdrop_path,
    posterPath: result.poster_path,
    rating: result.vote_average || 0,
    mediaType: result.media_type || "",
    genreTitle: generateGenreTitle(genreIds),
  };
}

export function transformTMDBSeason(season: TMDBTVSeriesDetailsSeason) {
  return {
    seasonNumber: season.season_number,
    description: (season.overview || "").trim(),
    releaseDate: season.air_date,
    rating: season.vote_average,
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

export async function findTMDBResultsByIMDBId(imdbId: string, type: string) {
  const response = await findTMDBResultsByIMDBIdResponse(imdbId);

  if (type === "movie") {
    return response.movie_results.map(transformTMDBResult);
  } else {
    if (response.tv_results.length > 0) {
      return response.tv_results.map(transformTMDBResult);
    }
    if (response.tv_episode_results.length > 0) {
      const tmdbId = response.tv_episode_results[0].show_id;
      const seasonNumber = response.tv_episode_results[0].season_number;
      const { seasons, ...withoutSeasons } = await getTMDBTVSeriesDetails(tmdbId);
      const season = seasons.find((s) => s.seasonNumber === seasonNumber);

      if (season) {
        const { seasonNumber: _, ...seasonWithoutNumber } = season;
        return [{ ...withoutSeasons, ...seasonWithoutNumber, mediaType: type }];
      }
    }
  }
  return [];
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
  const result = transformTMDBResult(response);
  const seasons = response.seasons.map(transformTMDBSeason);
  return { ...result, seasons };
}
