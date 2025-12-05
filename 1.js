// brovods.js - 小猫影视 Kitty JS 源
// by ChatGPT

export default class Brovods {
  getConfig() {
    return {
      id: "brovods",
      name: "博若影视（JS）",
      type: 1,
      api: "https://www.brovods.top/",
      nsfw: false,
      status: true,
      extra: {
        js: {
          category: "getCategory",
          home: "getHome",
          search: "getSearch",
          detail: "getDetail",
          parseIframe: "parseIframe"
        }
      }
    };
  }

  // ① 分类
  async getCategory() {
    return [
      { text: "电影", id: "1" },
      { text: "电视剧", id: "2" },
      { text: "综艺", id: "3" },
      { text: "动漫", id: "4" }
    ];
  }

  // 获取 HTML 工具
  async _get(url) {
    const res = await $http.get(url);
    return res.data;
  }

  // 解析单个视频卡片
  _parseVodList(html) {
    const regex = /<a class="stui-vodlist__thumb.*?href="(.*?)".*?title="(.*?)".*?data-original="(.*?)"/gs;
    let m;
    const list = [];
    while ((m = regex.exec(html))) {
      list.push({
        id: m[1],
        title: m[2],
        cover: m[3],
        remark: ""
      });
    }
    return list;
  }

  // ② 首页
  async getHome() {
    const html = await this._get("https://www.brovods.top/");
    return this._parseVodList(html);
  }

  // ③ 搜索
  async getSearch(key) {
    const url = `https://www.brovods.top/index.php/ajax/suggest?mid=1&wd=${encodeURIComponent(
      key
    )}`;
    const res = await $http.get(url);
    const data = JSON.parse(res.data || "{}");

    if (!data.list) return [];

    return data.list.map((i) => ({
      id: i.id,
      title: i.name,
      cover: i.pic,
      remark: ""
    }));
  }

  // 获取详情页 HTML 并解析播放
  async getDetail(id) {
    const url = id.startsWith("http")
      ? id
      : `https://www.brovods.top${id}`;

    const html = await this._get(url);

    // 标题
    const title =
      html.match(/<h1.*?>(.*?)<\/h1>/)?.[1] || "未知标题";

    // 封面
    const cover =
      html.match(/data-original="(.*?)"/)?.[1] || "";

    // 简介
    const desc =
      html.match(/<span class="detail-content.*?>([\s\S]*?)<\/span>/)?.[1]
        ?.trim()
        ?.replace(/<.*?>/g, "") || "";

    // 播放列表解析
    const playRegex =
      /<a\s+class="btn btn-default"\s+href="(.*?)"\s+title="(.*?)"/gs;

    let m;
    const playlist = [];
    while ((m = playRegex.exec(html))) {
      playlist.push({
        text: m[2],
        id: "$iframe_" + m[1]
      });
    }

    return {
      id,
      title,
      cover,
      desc,
      remark: "",
      playlist: playlist.length
        ? [{ name: "播放源", urls: playlist }]
        : []
    };
  }

  // ⑤ iframe 解析 → 返回真实播放地址
  async parseIframe(url) {
    url = url.replace("$iframe_", "");

    const html = await this._get(url);

    // brovods.top 的播放器通常在 iframe 内，真实地址在 player
    let real =
      html.match(/"url":"(.*?)"/)?.[1] ||
      html.match(/src="(.*?m3u8.*?)"/)?.[1] ||
      "";

    real = real.replace(/\\/g, "");

    return real;
  }
}
