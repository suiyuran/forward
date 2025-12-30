import { runUpdateJob } from "./utils.ts";

runUpdateJob({
  name: "Top250",
  subject: "movie_top250",
  start: 0,
  count: 250,
  outputPath: "./data/douban/top250.json",
});
