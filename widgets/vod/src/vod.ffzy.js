WidgetMetadata = {
  id: "suiyuran.forward.widgets.vod.ffzy",
  title: "非凡影视",
  description: "获取非凡影视的 VOD 资源",
  requiredVersion: "0.0.1",
  version: "1.1.2",
  author: "suiyuran",
  site: "https://github.com/suiyuran/forward",
  modules: [
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      params: [],
    },
  ],
};

const URL = "http://api.ffzyapi.com/api.php/provide/vod/from/ffm3u8/at/json/";
