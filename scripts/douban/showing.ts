import { runUpdateJob } from "./utils.ts";

runUpdateJob({
  name: "正在上映",
  subject: "movie_showing",
  start: 0,
  count: 50,
  outputPath: "./data/douban/showing.json",
});
