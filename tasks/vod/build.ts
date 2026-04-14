const CONFIG = {
  commonPath: "widgets/vod/src/vod.js",
  items: [
    {
      headerPath: "widgets/vod/src/vod.dytt.js",
      outputPath: "widgets/vod/dytt.js",
    },
    {
      headerPath: "widgets/vod/src/vod.ffzy.js",
      outputPath: "widgets/vod/ffzy.js",
    },
  ],
};

async function build() {
  const common = await Deno.readTextFile(CONFIG.commonPath);

  for (const config of CONFIG.items) {
    const header = await Deno.readTextFile(config.headerPath);
    const output = `${header.trimEnd()}\n\n${common.trimEnd()}\n`;
    await Deno.writeTextFile(config.outputPath, output);
  }
}

build();
