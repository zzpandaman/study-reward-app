# design-sources 初始化说明

当前为首版初始化，目标是恢复可协作路径与最小结构：

- 每个核心页面对应一个 `.pen` 文件。
- 页面内保留 `page` 框架与 `title` 文本，并补充可迭代语义分区（header/sidebar/content/form/list/detail）。
- `study-reward.tokens.pen` 提供最小可用 tokens（颜色、间距、圆角、字体层级）。

后续迭代建议：

1. 以 `code-map.md` 为索引，从代码侧变更反推设计侧节点更新。
2. 需要细化视觉时，优先复用现有分区节点，不重建页面骨架。
3. 每次改动同步更新 `code-map.md` 与本文件说明。
