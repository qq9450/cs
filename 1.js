// czzymovie.js - 小猫影视 JS 源 (已修复所有未定义问题)

export default class CZZY {
  getConfig() {
    return {
      id: "czzy",
      name: "厂长资源（JS）",
      type: 1,
      api: "https://www.czzymovie.com/",
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
    }
  }

  // 网络工具
  async _get(url) {
    const res = await $http.get(url);
    return res.data;
  }

  // 分类
  async getCategory() {
    return [
      { text: "电影", id: "movie" },
      { text: "电视剧", id: "tv" },
      { text: "综艺", id: "variety" },
      { text: "动漫", id: "anime" }
    ];
  }

  // 列表解析
  _parseList(html) {
    const reg = /<a href="(\/vod\/[^"]+)"[^>]*>\s*<img[^>]*data-original="([^"]+)"[^>]*alt="([^"]+)"/g;
    let m;
    const list = [];
    while ((m = reg.exec(html))) {
      list.push({
        id: m[1],
        title: m[3],
        cover: m[2],
        remark: ""
      });
    }
    return list;
  }

  // 首页
  async getHome() {
    const html = await this._get("https://www.czzymovie.com/");
    return this._parseList(html);
  }

  // 搜索
  async getSearch(key) {
    const url = `https://www.czzymovie.com/index.php/ajax/suggest?mid=1&wd=${encodeURIComponent(key)}`;
    try {
      const res = await $http.get(url);
      const data = JSON.parse(res.data || "{}");

      if (!data.list) return [];

      return data.list.map(i => ({
        id: `/vod/detail/${i.id}.html`,
        title: i.name,
        cover: i.pic,
        remark: ""
      }));
    } catch (e) {
      return [];
    }
  }

  // 详情
  async getDetail(id) {
    const url = id.startsWith("http") ? id : `https://www.czzymovie.com${id}`;
    const html = await this._get(url);

    const title = html.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] || "";
    const cover = html.match(/data-original="([^"]+)"/)?.[1] || "";
    const desc = html.match(/<div class="detail-content">([\s\S]*?)<\/div>/)?.[1]?.replace(/<[^>]+>/g, "") || "";

    const playlist = [];
    const regPlay = /href="(\/vod\/play\/[^"]+)"[^>]*>([^<]+)<\/a>/g;
    let m;

    while ((m = regPlay.exec(html))) {
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
      playlist: playlist.length ? [{ name: "播放源", urls: playlist }] : []
    };
  }

  // 播放解析
  async parseIframe(url) {
    url = url.replace("$iframe_", "");
    const html = await this._get("https://www.czzymovie.com" + url);

    let real =
      html.match(/source\s+src="([^"]+\.m3u8[^"]*)"/)?.[1] ||
      html.match(/"file":"([^"]+\.m3u8[^"]*)"/)?.[1] ||
      "";

    return real.replace(/\\/g, "");
  }
}
