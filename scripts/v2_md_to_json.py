#!/usr/bin/env python3
"""v2-费曼版 markdown → 产品 dayN.json （严格对照 app.js 字段契约 · 重写版）

关键修正 vs 旧版:
1. true_false / scale 跟 single_choice 同构: 抓「选项」块 + 逐项反馈, type 不同
2. multiple_choice 的 correctAnswer 拆逗号成真数组
3. 反馈用「按标签分段」鲁棒抓取(旧版前瞻正则在 Day31-71 漏抓)
4. 最后一页 content(next=无) 标成 type:summary (触发 markDayCompleted)
5. 多选反馈: 「全选正确」→allCorrectFeedback, 「漏选「optN」」→逐项 feedback
"""
import json, re, sys
from pathlib import Path

SRC_ROOT = Path("/Users/handsomeng/Obsidian/9-幸福计划/v2-费曼版")
DST_ROOT = Path("/Users/handsomeng/vibecoding/xingfu-jihua-frontend/assets/days")

STAGES = [
    {"name": "觉察篇", "stageNumber": 1, "color": "#F09866", "bgColor": "#FBE3D1", "range": (1, 13)},
    {"name": "探索篇", "stageNumber": 2, "color": "#E5B14B", "bgColor": "#F6E5B6", "range": (14, 34)},
    {"name": "练习篇", "stageNumber": 3, "color": "#7BBE7E", "bgColor": "#D8EDD9", "range": (35, 61)},
    {"name": "内化篇", "stageNumber": 4, "color": "#7AA8D6", "bgColor": "#D5E5F0", "range": (62, 71)},
]

LABELS = ["题型", "分类", "问题", "选项", "必须答对", "正确答案", "容错答案",
          "占位提示", "必填", "反馈", "下一页", "按钮文案", "页面标题", "内容", "陈述", "题干"]

def get_stage(day):
    for s in STAGES:
        if s["range"][0] <= day <= s["range"][1]:
            return {k: s[k] for k in ("name", "stageNumber", "color", "bgColor")}
    return None

def clean(s):
    """剥引号空格反引号"""
    return s.strip().strip("`").strip("「」『』\"' ").strip()

def split_sections(page_text):
    """把一页按 **标签**： 切成 {标签: 值}。值可多行。"""
    label_re = re.compile(r"^\*\*(" + "|".join(LABELS) + r")\*\*[：:](.*)$")
    sections, cur_label, cur_lines = {}, None, []
    for line in page_text.split("\n"):
        m = label_re.match(line.strip())
        if m:
            if cur_label is not None:
                sections[cur_label] = "\n".join(cur_lines).strip()
            cur_label = m.group(1)
            cur_lines = [m.group(2).strip()] if m.group(2).strip() else []
        elif cur_label is not None:
            cur_lines.append(line)
    if cur_label is not None:
        sections[cur_label] = "\n".join(cur_lines).strip()
    return sections

def parse_options(opts_text):
    """1. 文字 (`opt1`) → [{id,label}]"""
    out = []
    for line in opts_text.split("\n"):
        m = re.match(r"^\s*\d+\.\s*(.+?)\s*\(`([^`]+)`\)\s*$", line)
        if m:
            out.append({"id": m.group(2), "label": m.group(1).strip()})
    return out

def parse_feedback_lines(fb_text):
    """解析 - key：value 列表。返回 (映射dict, 整段text)。
       key 可能是: opt1 / 全选正确 / 漏选「opt1」 / 答对（..） / 答错 等。"""
    mapping, plain = {}, []
    if not fb_text.strip():
        return mapping, ""
    if not fb_text.lstrip().startswith("-"):
        return mapping, clean(fb_text)
    cur_key, cur_val = None, []
    for line in fb_text.split("\n"):
        m = re.match(r"^\s*-\s*(.+?)[：:](.*)$", line)
        if m:
            if cur_key is not None:
                mapping[cur_key] = clean("\n".join(cur_val))
            cur_key = m.group(1).strip()
            cur_val = [m.group(2)]
        elif cur_key is not None:
            cur_val.append(line)
    if cur_key is not None:
        mapping[cur_key] = clean("\n".join(cur_val))
    return mapping, ""

def fb_for_opt(mapping, opt_id):
    """取某个 opt 的反馈。兼容: 'opt1' / '漏选「opt1」' / 范围 'opt1-4' / '其他' 兜底。"""
    if opt_id in mapping:
        return mapping[opt_id]
    num = int(re.sub(r"\D", "", opt_id) or "0")
    # 精确含 opt_id（如 漏选「opt1」），但排除范围写法（opt1-4）
    for k, v in mapping.items():
        if opt_id in k and not re.search(r"opt\d+\s*[-~到]", k):
            return v
    # 范围写法 opt1-4 / opt1~4 / opt1到4
    for k, v in mapping.items():
        m = re.search(r"opt(\d+)\s*[-~到]\s*(?:opt)?(\d+)", k)
        if m and int(m.group(1)) <= num <= int(m.group(2)):
            return v
    # 其他 / 剩余 兜底（排除「略」这种无实质内容的）
    for k, v in mapping.items():
        if k.strip() in ("其他", "剩余", "其余") and v.strip().rstrip("。") not in ("略", ""):
            return v
    return ""

def find_all_correct_fb(mapping):
    for k, v in mapping.items():
        if "全选正确" in k or "全对" in k or "全选对" in k or k.strip() in ("答对", "答对了", "正确"):
            return v
    return ""

def parse_page(page_text, idx, total, day_num):
    m_head = re.match(r"^###\s*(p\d+)\s*·\s*(\w+)", page_text)
    if not m_head:
        return None
    pid, kind = m_head.group(1), m_head.group(2).upper()
    sec = split_sections(page_text)
    page = {"id": pid}

    # next: 下一页 `pN` 或 「无」
    nxt = clean(sec.get("下一页", ""))
    nxt_id = None
    mnx = re.search(r"(p\d+)", nxt)
    if mnx:
        nxt_id = mnx.group(1)
    is_last = (nxt_id is None) or (idx == total - 1)

    title = clean(sec.get("页面标题", ""))

    if kind == "CONTENT":
        # reading 锚点页: 有「附属阅读」字段 或 标题含「完整阅读」→ type:reading
        if "附属阅读" in page_text or "完整阅读" in title:
            page["type"] = "reading"
            page["title"] = title or "今日完整阅读"
            page["source"] = f"readings/day{day_num}.md"
            if sec.get("按钮文案"):
                page["buttonText"] = clean(sec["按钮文案"])
            if nxt_id:
                page["next"] = nxt_id
            return page
        page["type"] = "summary" if is_last else "content"
        if title:
            page["title"] = title
        page["body"] = sec.get("内容", "").strip()
        if sec.get("按钮文案"):
            page["buttonText"] = clean(sec["按钮文案"])
        if nxt_id:
            page["next"] = nxt_id
        return page

    # QUESTION
    qtype = clean(sec.get("题型", "")).upper()
    cat_raw = sec.get("分类", "")
    category = "awareness" if "觉察" in cat_raw else ("knowledge" if "知识" in cat_raw else None)
    # 问题 / 陈述 / 题干 任一
    question = (sec.get("问题") or sec.get("陈述") or sec.get("题干") or "").strip()
    must = clean(sec.get("必须答对", "")).lower() == "true"
    correct_raw = sec.get("正确答案", "")
    correct_ids = re.findall(r"`([^`]+)`", correct_raw)
    # 反引号里可能是 "opt1, opt2" 整串 → 拆
    flat = []
    for c in correct_ids:
        for part in re.split(r"[,，]", c):
            part = part.strip()
            if part:
                flat.append(part)
    correct_ids = flat
    fb_map, fb_plain = parse_feedback_lines(sec.get("反馈", ""))
    options = parse_options(sec.get("选项", "")) if sec.get("选项") else []

    if nxt_id:
        page["next"] = nxt_id

    # SINGLE_CHOICE / TRUE_FALSE / SCALE 同构: 选项 + 逐项反馈
    if qtype in ("SINGLE_CHOICE", "TRUE_FALSE", "SCALE"):
        page["type"] = {"SINGLE_CHOICE": "single_choice",
                        "TRUE_FALSE": "true_false",
                        "SCALE": "scale"}[qtype]
        if category:
            page["category"] = category
        page["question"] = question
        for o in options:
            o["feedback"] = fb_for_opt(fb_map, o["id"])
        page["options"] = options
        # 整段总反馈（知识题常见: 一句话讲对错要点, 不分选项）→ 存 page.feedback, app.js 兜底显示
        if fb_plain and not any(o.get("feedback", "").strip() for o in options):
            page["feedback"] = fb_plain
        if must and correct_ids:
            page["mustCorrect"] = True
            page["correctAnswer"] = correct_ids[0]
    elif qtype == "MULTIPLE_CHOICE":
        page["type"] = "multiple_choice"
        if category:
            page["category"] = category
        page["question"] = question
        for o in options:
            o["feedback"] = fb_for_opt(fb_map, o["id"])
        page["options"] = options
        if must:
            page["mustCorrect"] = True
        if correct_ids:
            page["correctAnswers"] = correct_ids
        ac = find_all_correct_fb(fb_map)
        if ac:
            page["allCorrectFeedback"] = ac
    elif qtype == "FILL_BLANK":
        page["type"] = "fill_blank"
        if category:
            page["category"] = category
        page["question"] = question
        if sec.get("占位提示"):
            page["placeholder"] = clean(sec["占位提示"])
        if must:
            page["mustCorrect"] = True
        if correct_ids:
            page["correctAnswer"] = correct_ids[0]
        acc = re.findall(r"`([^`]+)`", sec.get("容错答案", ""))
        accflat = []
        for a in acc:
            for part in re.split(r"[,，]", a):
                part = part.strip()
                if part:
                    accflat.append(part)
        if accflat:
            page["acceptAnswers"] = accflat
        fb = {}
        for k, v in fb_map.items():
            if k.startswith("答对") or k.startswith("正确"):
                fb["correct"] = v
            elif k.startswith("答容错") or k.startswith("容错"):
                fb["accept"] = v
            elif k.startswith("答错") or k.startswith("错"):
                fb["wrong"] = v
        if fb:
            page["feedback"] = fb
    elif qtype == "TEXT":
        page["type"] = "text"
        if category:
            page["category"] = category
        page["question"] = question
        if sec.get("占位提示"):
            page["placeholder"] = clean(sec["占位提示"])
        if clean(sec.get("必填", "")).lower() == "true":
            page["required"] = True
        if fb_plain:
            page["feedback"] = fb_plain
    else:
        page["type"] = qtype.lower()
        page["question"] = question
    return page

def parse_day(md, day_num):
    theme = ""
    m = re.search(r"\*\*当天主题\*\*[：:]\s*(.+)", md)
    if m: theme = clean(m.group(1))
    core = ""
    m = re.search(r"\*\*一句话核心\*\*[：:]\s*(.+)", md)
    if m: core = clean(m.group(1))

    # 切到 AI 分析报告之前
    m_ai = re.search(r"^##\s*AI\s*分析报告", md, re.MULTILINE)
    if m_ai:
        md = md[:m_ai.start()]
    # 也切「### 输入数据」这种报告附属段
    m_in = re.search(r"^###\s*输入数据", md, re.MULTILINE)
    if m_in:
        md = md[:m_in.start()]

    starts = [(m.start(), m.group(1)) for m in re.finditer(r"^###\s*(p\d+)\s*·", md, re.MULTILINE)]
    pages = []
    for i, (st, pid) in enumerate(starts):
        end = starts[i+1][0] if i+1 < len(starts) else len(md)
        p = parse_page(md[st:end], i, len(starts), day_num)
        if p:
            pages.append(p)
    # 兜底: 非末页若缺 next, 自动补成下一页 id (markdown 源偶有漏写「下一页」)
    for i in range(len(pages) - 1):
        if not pages[i].get("next"):
            pages[i]["next"] = pages[i + 1]["id"]
    return {"day": day_num, "stage": get_stage(day_num),
            "theme": theme, "coreLine": core,
            "totalPages": len(pages), "pages": pages}

def main():
    files = [f for f in sorted(SRC_ROOT.glob("阶段*/Day*.md")) if "-阅读-" not in f.name]
    ok, fail = 0, []
    for src in files:
        m = re.match(r"^Day0*(\d+)-", src.name)
        if not m: continue
        n = int(m.group(1))
        if not (1 <= n <= 71): continue
        try:
            data = parse_day(src.read_text(encoding="utf-8"), n)
            if not data["pages"]:
                raise ValueError("空")
            (DST_ROOT / f"day{n}.json").write_text(
                json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            ok += 1
        except Exception as e:
            fail.append((n, str(e)))
    print(f"成功 {ok} / {len(files)}，失败: {fail}")

if __name__ == "__main__":
    main()
