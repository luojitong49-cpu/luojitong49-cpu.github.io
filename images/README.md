# 图片结构说明

## 首页

- `home/cover.jpg` 首页摄影桌面封面图，当前已接入。

## 地点作品

作品图片已经从 `C:/Users/123/Desktop/照片集/` 导入并压缩到以下目录：

- `places/haiyan/` 海晏村，48 张作品 + `cover.jpg`
- `places/laoyuhe/` 捞鱼河，8 张作品 + `cover.jpg`
- `places/cuihu/` 翠湖，28 张作品 + `cover.jpg`
- `places/dounan/` 斗南，60 张作品 + `cover.jpg`
- `places/wulongcun/` 乌龙村，14 张作品 + `cover.jpg`
- `places/shaolinsi/` 少林寺，19 张作品 + `cover.jpg`
- `places/kmust/` 昆明理工大学，11 张作品 + `cover.jpg`
- `places/zhenping/` 镇平，16 张作品 + `cover.jpg`

## 其他页面封面

- `about/cover.jpg` 关于页顶部封面
- `about/portrait.jpg` 关于页视觉图
- `film/film-cover.jpg` 胶片页顶部封面

## 修改内容

- 地点文字与地图点位：`data/places.ts`
- 作品标题、主题、时间、说明与图片路径：`data/photos.ts`
- 如需重新从桌面照片集生成图片和数据，运行：`node work/generate-portfolio-content.js`
