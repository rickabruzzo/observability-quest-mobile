import sys
import os
import gc
import time

def _write_top_level_error(label, exc):
    try:
        with open("/error.log", "w") as _f:
            _f.write(f"=== {label} ===\n")
            _f.write(f"Type: {type(exc).__name__}\n")
            _f.write(f"Message: {str(exc)}\n")
            _f.write("\nTraceback:\n")
            sys.print_exception(exc, _f)
    except Exception:
        pass


try:
    sys.path.insert(0, "/system/apps/observability_quest")
    os.chdir("/system/apps/observability_quest")

    badge.mode(HIRES | VSYNC)
    screen.antialias = image.X4

    # ── fonts ─────────────────────────────────────────────────────────────────────
    large_font = pixel_font.load("/system/assets/fonts/yesterday.ppf")
    small_font  = pixel_font.load("/system/assets/fonts/nope.ppf")

    # ── preload images ────────────────────────────────────────────────────────────
    IMG_TITLE    = image.load("assets/title_screen.png")
    IMG_LOGO     = image.load("assets/hc_logo_white.png")  # 192×48 full logo
    IMG_LOGOMARK = image.load("assets/hc_logomark.png")  # 48×48 logomark
    IMG_S1    = image.load("assets/s1_llm.png")
    IMG_S2    = image.load("assets/s2_microservices.png")
    IMG_S3    = image.load("assets/s3_ecommerce.png")
    IMG_S4    = image.load("assets/s4_spaghetti.png")
    IMG_S5    = image.load("assets/s5_payments.png")
    SCENE_IMGS = [None, IMG_S1, IMG_S2, IMG_S3, IMG_S4, IMG_S5]
    IMG_PORT = [
        image.load("assets/portrait_christine.png"),
        image.load("assets/portrait_emily.png"),
        image.load("assets/portrait_graham.png"),
        image.load("assets/portrait_julie.png"),
        image.load("assets/portrait_matt.png"),
    ]
    IMG_CHARITY = image.load("assets/portrait_charity.png")

    # ── paginated text state ─────────────────────────────────────────────────────
    _page_texts   = [[]]
    _type_header  = ["", ""]    # [role, company] — stripped from intro before pagination
    _portrait_mode = [False]
    _narrator = ["", ""]    # [name, title] for portrait outcome screens
    _page_idx = [0]

    # ── game state ────────────────────────────────────────────────────────────────
    class GS:
        TITLE      = 0
        INTRO      = 1
        CHOICE     = 2
        WIN        = 3
        LOSE       = 4
        TRANSITION = 5
        FINAL      = 6

    state             = GS.TITLE
    score             = 0
    scenario_idx      = 0
    intro_idx         = 0
    scored_this_round = False
    _choice_sel       = [0]

    # ── scenario data ─────────────────────────────────────────────────────────────
    SCENARIOS = [
        {   # 1 — LLM Observability (Intercom / Fin AI)
            "image": "s1_llm",
            "intro": [
                {"text": "LEAD ENGINEER\nCUSTOMER SERVICE PLATFORM\n\nYour team just wired 12 different LLMs into your AI chatbot. It looked great in staging. Now it is 3am and you have had your fourth outage this week."},
                {"text": "The system is slow and unstable. SLO burn is accelerating. Your on-call rotation is already fried.\n\nYou need to find the root cause fast.\n\nHOW DO YOU INVESTIGATE?"},
            ],
            "narrator": ["CHRISTINE YEN", "CEO & CO-FOUNDER"],
            "choice_a": "HONEYCOMB\nTrace every LLM request",
            "choice_b": "SPLUNK\nGrep 40k lines of JSON",
            "win_text":  "NICE WORK.\n\nWith Honeycomb LLM observability you traced every request across all 12 models in minutes.\n\nYou found a nightly cron job quietly starving threads at peak hours. Fixed before customers noticed. SLO: RECOVERED.",
            "lose_text": "BAD CALL.\n\nYou opened Splunk and started grepping logs at 3am.\n\nTwo hours later you have read 40000 lines of JSON and found nothing. Your customers are tweeting. Your CEO is awake.\n\nCongratulations. The incident is now your personality.",
        },
        {   # 2 — Distributed Tracing (Nubank)
            "image": "s2_microservices",
            "intro": [
                {"text": "CTO\nFINTECH COMPANY\n\nYou just completed a 2-year migration. Your on-prem monolith is gone. You now run 350 cloud microservices. It is beautiful. It is also completely opaque."},
                {"text": "Customer transactions are taking a mysterious path through your new architecture. Support tickets are climbing.\n\nYou need to understand the full customer journey.\n\nWHAT IS YOUR STRATEGY?"},
            ],
            "narrator": ["EMILY NAKASHIMA", "SVP, ENGINEERING"],
            "choice_a": "HONEYCOMB\nFollow any user, 350 svcs",
            "choice_b": "NEW RELIC\n350 green dashboards",
            "win_text":  "EXCELLENT.\n\nWith Honeycomb high-cardinality spans you tagged every event with User ID and Trace ID.\n\nYou followed any customer across all 350 services in a single query. Root cause found in 4 minutes. RCA done.",
            "lose_text": "BOLD CHOICE.\n\nYou now have 350 New Relic dashboards. Each one shows a green checkmark.\n\nMeanwhile customer transactions are silently failing between services. Metrics have no context.\n\nDashboards are fine. Customers are not.",
        },
        {   # 3 — Frontend Observability (Fender)
            "image": "s3_ecommerce",
            "intro": [
                {"text": "DIRECTOR OF PLATFORM ENGINEERING\nMUSIC INSTRUMENT BRAND\n\nYour e-commerce site sells guitars. Your learning app teaches people to play them. Both are slow for some users. You just do not know which users or why."},
                {"text": "Conversion rates are dropping. Someone mentions Core Web Vitals. Your existing RUM tool shows a single average page load time.\n\nAverage is a lie. You need the outliers.\n\nWHAT DO YOU DO?"},
            ],
            "narrator": ["GRAHAM SIENER", "SVP, PRODUCT"],
            "choice_a": "HONEYCOMB\nFind the 8% with bad loads",
            "choice_b": "KEEP THE RUM TOOL\nAvg load: 2.1s. Looks fine.",
            "win_text":  "GOOD CALL.\n\nWith Honeycomb frontend observability you tagged traces with User ID and browser context.\n\nYou found a specific Chrome version causing 14-second loads for 8% of users hidden inside your averages. Fixed. Conversions up. Guitars sold.",
            "lose_text": "MOMENT OF SILENCE.\n\nYour RUM dashboard shows average page load: 2.1 seconds. Looks fine.\n\nSomewhere 8% of your users are watching a spinner and buying from a competitor.\n\nYour aggregate metrics are a beautiful lie and you will never know it.",
        },
        {   # 4 — Tool Consolidation (Duolingo)
            "image": "s4_spaghetti",
            "intro": [
                {"text": "STAFF SITE RELIABILITY ENGINEER\nLANGUAGE LEARNING PLATFORM\n\nYou run a 99.99 percent reliability initiative. Your service graph looks like a plate of spaghetti. You have a log tool, an APM, a metrics system, a tracing tool, and a SIEM."},
                {"text": "When incidents happen engineers spend hours pivoting between 5 platforms trying to stitch together a narrative.\n\nLicensing costs are ballooning. Morale is suffering.\n\nHOW DO YOU FIX THIS?"},
            ],
            "narrator": ["JULIE NEUMANN", "CMO"],
            "choice_a": "HONEYCOMB\nUnify logs, traces, metrics",
            "choice_b": "ADD A SIXTH TOOL\nCorrelate the other five",
            "win_text":  "GENIUS.\n\nYou sunsetted 3 tools and moved everything into Honeycomb.\n\nLogs, traces, and metrics unified. Engineers stop pivoting between platforms. Tooling costs down 16 percent. Your team sleeps again.",
            "lose_text": "A BOLD VISION.\n\nYou bought a sixth tool to correlate the other five.\n\nIt requires its own oncall rotation, has a 40-page setup guide, and costs more than the five tools combined.\n\nThe spaghetti now has a sixth noodle. Bon appetit.",
        },
        {   # 5 — High-Cardinality Tracing (Moov)
            "image": "s5_payments",
            "intro": [
                {"text": "CTO\nPAYMENTS PLATFORM\n\nYour platform moves money through your app, 3 payment processors, a card issuer, and a bank. A transaction just failed. A client is on the phone. You have no idea where the money stopped."},
                {"text": "Your platform processes thousands of transactions a minute. Each touches 6 external providers. Risk and product teams also need visibility.\n\nYou need ONE tool to trace a single dollar start to finish.\n\nWHAT DO YOU CHOOSE?"},
            ],
            "narrator": ["MATT NELSON", "CRO"],
            "choice_a": "HONEYCOMB\nTrace one dollar, 6 hops",
            "choice_b": "GRAFANA\nAggregate metrics dashboard",
            "win_text":  "PERFECT.\n\nWith Honeycomb you trace any individual transaction through all 6 hops in seconds.\n\nEngineering, product, and risk teams all query the same data. Failed transaction found in 90 seconds. Client satisfied. You slept fine.",
            "lose_text": "INTERESTING CHOICE.\n\nYour Grafana dashboard: transactions normal, error rate 0.02 percent.\n\nThat 0.02 percent is your client's wire transfer frozen between providers 3 and 4. You will be on this call for four hours. Dashboard stays green.",
        },
    ]

    VERDICTS = {
        5: "PRODUCTION READY. YOU ARE HIRED.",
        4: "STRONG. ONE BAD CALL BUT YOU LIVED.",
        3: "RESPECTABLE. ROOM TO GROW.",
        2: "ROUGH. YOUR ON-CALL HATES YOU.",
        1: "PLEASE CALL HONEYCOMB IMMEDIATELY.",
        0: "PLEASE CALL HONEYCOMB IMMEDIATELY.",
    }

except Exception as e:
    _write_top_level_error("BOOT-TIME EXCEPTION", e)
    raise


# ── helpers ───────────────────────────────────────────────────────────────────

def any_button():
    return badge.pressed(BUTTON_UP) or badge.pressed(BUTTON_DOWN) or badge.pressed(BUTTON_A) or badge.pressed(BUTTON_B) or badge.pressed(BUTTON_C)

def honeycomb_btn():
    return badge.pressed(BUTTON_A)

def competitor_btn():
    return badge.pressed(BUTTON_C)

def blink():
    return int(badge.ticks / 900) % 2

def draw_text_wrapped(text, x, y, w, h, col):
    """Word-wrap and draw text inside a bounding box. Handles \n as hard breaks."""
    screen.font = large_font
    screen.pen = color.rgb(*col)
    lh = 13
    cy = y
    for paragraph in text.split("\n"):
        if cy + lh > y + h:
            break
        if paragraph == "":
            cy += lh // 2
            continue
        words = paragraph.split()
        line = ""
        for word in words:
            test = line + word + " "
            tw, _ = screen.measure_text(test)
            if tw > w and line:
                screen.text(line.rstrip(), vec2(x, cy))
                cy += lh
                line = word + " "
                if cy + lh > y + h:
                    break
            else:
                line = test
        if line and cy + lh <= y + h:
            screen.text(line.rstrip(), vec2(x, cy))
            cy += lh

def prompt_blink(msg, y):
    if blink():
        py = 150 if _portrait_mode[0] else 125
        screen.pen = color.rgb(249, 110, 16)
        screen.rectangle(88, py, 144, 22)
        screen.pen = color.rgb(0, 0, 0)
        screen.rectangle(89, py + 1, 142, 20)
        screen.pen = color.rgb(20, 20, 30)
        screen.rectangle(90, py + 2, 140, 18)
        screen.font = small_font
        screen.pen = color.rgb(255, 176, 0)
        tw, _ = screen.measure_text("PRESS ANY BUTTON")
        screen.text("PRESS ANY BUTTON", vec2(160 - tw // 2, py + 3))

def center_text_large(text, y, col=(255, 255, 85)):
    screen.font = large_font
    screen.pen = color.rgb(*col)
    tw, _ = screen.measure_text(text)
    screen.text(text, vec2(160 - tw // 2, y))

def draw_logo(cx, cy):
    # Full horizontal logo, 192×48 — used on title screen
    screen.blit(IMG_LOGO, vec2(cx - 96, cy - 24))

def draw_logomark(cx, cy):
    # 48×48 logomark — used in-app after title
    screen.blit(IMG_LOGOMARK, vec2(cx - 24, cy - 24))

def start_text(text):
    _type_header[0] = ""
    _type_header[1] = ""
    lines_raw = text.split("\n")

    # Extract header: first two non-empty lines followed by a blank line
    if len(lines_raw) >= 3 and lines_raw[0] and lines_raw[1] and lines_raw[2] == "":
        role = lines_raw[0]
        company = lines_raw[1]
        body = "\n".join(lines_raw[3:]).strip()
        if _portrait_mode[0]:
            # Portrait mode: header is already set by start_portrait_text, skip
            text = body
        else:
            # Scenario intro: construct leading sentence with smart casing
            _lc_words = {"of", "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "nor", "by"}
            def smart_case(w):
                if w.lower() in _lc_words:
                    return w.lower()
                if w.isupper() and len(w) <= 3:
                    return w
                return w[0].upper() + w[1:].lower() if w else w
            role_fmt = " ".join(smart_case(w) for w in role.split())
            company_fmt = " ".join(smart_case(w) for w in company.split())
            text = "You are a " + role_fmt + " at " + company_fmt + ". " + body

    # Word-wrap using pixel measurement
    MAX_PX = 286
    screen.font = large_font
    lines = []
    for para in text.split("\n"):
        if para == "":
            lines.append("")
            continue
        words = para.split()
        line = ""
        for word in words:
            test = (line + " " + word).strip() if line else word
            tw, _ = screen.measure_text(test)
            if tw > MAX_PX and line:
                lines.append(line)
                line = word
            else:
                line = test
        if line:
            lines.append(line)

    # Pixel-based pagination
    # Box inner top: 151, inner bottom: 236 (height 85)
    # Text y_start: 177 with header, 155 without
    # Line height: 13px, blank line: 6px
    # CTA (ALL CAPS, ends with ?) always gets its own page
    SENTENCE_END = ('.', '!', '?', '"', "'")
    BOX_BOTTOM = 238
    y_start_base = (170 + 24) if _portrait_mode[0] else 174
    LH = 13
    BLANK_H = 6

    pages = []
    buf = []
    y_start = y_start_base
    y_cursor = y_start

    def flush():
        # Trim trailing blanks from buf before saving
        b = list(buf)
        while b and b[-1] == "":
            b.pop()
        if b:
            pages.append(b)

    for ln in lines:
        # Detect CTA: non-empty, ALL CAPS, ends with ?
        is_cta = ln and ln.rstrip().endswith("?") and ln == ln.upper()

        if is_cta:
            flush()
            buf.clear()
            pages.append([ln])
            y_cursor = y_start
        else:
            h = BLANK_H if ln == "" else LH
            if buf and y_cursor + h > BOX_BOTTOM:
                flush()
                buf.clear()
                y_start = (170 + 14) if _portrait_mode[0] else 174
                y_cursor = y_start
            buf.append(ln)
            y_cursor += h

    flush()

    if not pages:
        pages.append([])

    # Store all pages
    _page_texts.clear()
    for pg in pages:
        _page_texts.append(pg)

    # Ellipsis: only when page-0 break is mid-sentence
    if len(_page_texts) > 1 and _page_texts[1]:
        last_p0 = ""
        for i in range(len(_page_texts[0]) - 1, -1, -1):
            if _page_texts[0][i]:
                last_p0 = _page_texts[0][i]
                break
        first_p1 = ""
        for ln in _page_texts[1]:
            if ln:
                first_p1 = ln
                break
        is_mid_sentence = (
            last_p0 and
            not last_p0.rstrip().endswith(SENTENCE_END) and
            first_p1 and
            first_p1[0].islower()
        )
        if is_mid_sentence:
            for i in range(len(_page_texts[0]) - 1, -1, -1):
                if _page_texts[0][i]:
                    _page_texts[0][i] = _page_texts[0][i] + "..."
                    break
            for i in range(len(_page_texts[1])):
                if _page_texts[1][i]:
                    _page_texts[1][i] = "..." + _page_texts[1][i]
                    break

    _page_idx[0] = 0

def _draw_type_box():
    by = 170
    bh = 69
    screen.pen = color.rgb(249, 110, 16)
    screen.rectangle(8, by, 304, bh)
    screen.pen = color.rgb(0, 0, 0)
    screen.rectangle(10, by + 2, 300, bh - 4)
    screen.pen = color.rgb(8, 12, 20)
    screen.rectangle(11, by + 3, 298, bh - 6)
    if _narrator[0]:
        screen.font = small_font
        screen.pen = color.rgb(255, 176, 0)
        screen.text(_narrator[0], vec2(14, by + 6))
        screen.pen = color.rgb(2, 152, 236)
        screen.text(_narrator[1], vec2(14, by + 15))

def start_portrait_text(text, name, title):
    _portrait_mode[0] = True
    _narrator[0] = name
    _narrator[1] = title
    start_text(text)

def _render_page_lines(page_lines):
    screen.font = large_font
    screen.pen = color.rgb(220, 240, 255)
    if _portrait_mode[0]:
        by = 170
        y_pos = by + 24 if (_narrator[0]) else by + 8
        box_bottom = 238
    else:
        by = 170
        y_pos = 174
        box_bottom = 238
    for ln in page_lines:
        if ln == "":
            y_pos += 6
            continue
        if y_pos + 13 > box_bottom:
            break
        screen.text(ln, vec2(14, y_pos))
        y_pos += 13

def _draw_control_hints(can_back, can_forward):
    # Black chip centered horizontally, sitting on the top keyline of the text box.
    # Text box top edge is y=170 with a 2px Tango orange border; the chip sits at
    # y=164 (overlapping the keyline by ~2px and extending ~4px into the box).
    CHIP_X = 94          # 160 - 132/2
    CHIP_Y = 164
    CHIP_W = 132
    CHIP_H = 12
    screen.pen = color.rgb(0, 0, 0)
    screen.rectangle(CHIP_X, CHIP_Y, CHIP_W, CHIP_H)

    screen.font = small_font

    # Centered within each half of the chip.
    half_left_center  = CHIP_X + CHIP_W // 4              # 94 + 33 = 127
    half_right_center = CHIP_X + (3 * CHIP_W) // 4        # 94 + 99 = 193
    text_y = CHIP_Y + 2

    back_label = "[A] BACK"
    next_label = "[C] NEXT"

    bw, _ = screen.measure_text(back_label)
    nw, _ = screen.measure_text(next_label)

    if can_back:
        screen.pen = color.rgb(255, 176, 0)
    else:
        screen.pen = color.rgb(80, 80, 90)
    screen.text(back_label, vec2(half_left_center - bw // 2, text_y))

    if can_forward:
        screen.pen = color.rgb(255, 176, 0)
    else:
        screen.pen = color.rgb(80, 80, 90)
    screen.text(next_label, vec2(half_right_center - nw // 2, text_y))

# ── update (called every frame by badgeware) ──────────────────────────────────

def update():
    global state, score, scenario_idx, intro_idx
    global scored_this_round

    # ── TITLE ─────────────────────────────────────────────────────────────────
    if state == GS.TITLE:
        screen.blit(IMG_TITLE, vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 214, 320, 26)
        draw_logo(160, 38)
        if blink():
            screen.font = small_font
            screen.pen = color.rgb(100, 186, 0)
            tw, _ = screen.measure_text("[ ANY BUTTON TO START ]")
            screen.text("[ ANY BUTTON TO START ]", vec2(160 - tw // 2, 220))
        if any_button():
            score        = 0
            scenario_idx = 0
            intro_idx    = 0
            start_text(SCENARIOS[0]["intro"][0]["text"])
            state        = GS.INTRO
            gc.collect()

    # ── INTRO ─────────────────────────────────────────────────────────────────
    elif state == GS.INTRO:
        sc = SCENARIOS[scenario_idx]
        screen.blit(SCENE_IMGS[scenario_idx + 1], vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 214, 320, 26)

        _draw_type_box()
        _render_page_lines(_page_texts[_page_idx[0]])

        can_back    = _page_idx[0] > 0 or intro_idx > 0
        can_forward = True
        _draw_control_hints(can_back, can_forward)

        if badge.pressed(BUTTON_A) and can_back:
            if _page_idx[0] > 0:
                _page_idx[0] -= 1
            elif intro_idx > 0:
                intro_idx -= 1
                start_text(sc["intro"][intro_idx]["text"])
                _page_idx[0] = len(_page_texts) - 1
                gc.collect()
        elif badge.pressed(BUTTON_C):
            if _page_idx[0] < len(_page_texts) - 1:
                _page_idx[0] += 1
            else:
                intro_idx += 1
                if intro_idx >= len(sc["intro"]):
                    intro_idx = 0
                    state = GS.CHOICE
                    gc.collect()
                else:
                    start_text(sc["intro"][intro_idx]["text"])
                    gc.collect()

    # ── CHOICE ────────────────────────────────────────────────────────────────
    elif state == GS.CHOICE:
        sc = SCENARIOS[scenario_idx]
        screen.blit(SCENE_IMGS[scenario_idx + 1], vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 214, 320, 26)

        # Menu box — dark background with Cobalt border
        screen.pen = color.rgb(2, 120, 205)
        screen.rectangle(8, 170, 304, 68)
        screen.pen = color.rgb(0, 0, 0)
        screen.rectangle(10, 172, 300, 64)
        screen.pen = color.rgb(15, 20, 35)
        screen.rectangle(11, 173, 298, 62)

        options = [sc["choice_a"], sc["choice_b"]]
        option_y = [176, 203]

        for i, opt in enumerate(options):
            lines = opt.split("\n")[:2]
            if i == _choice_sel[0]:
                # Highlighted — Honey yellow with cursor arrow
                screen.font = large_font
                screen.pen = color.rgb(255, 176, 0)
                screen.text(">", vec2(14, option_y[i]))
                for j, line in enumerate(lines):
                    screen.text(line, vec2(26, option_y[i] + j * 11))
            else:
                # Unselected — dim gray
                screen.font = large_font
                screen.pen = color.rgb(130, 130, 130)
                for j, line in enumerate(lines):
                    screen.text(line, vec2(26, option_y[i] + j * 11))

        # Input — UP/DOWN to move cursor, B to confirm
        if badge.pressed(BUTTON_UP):
            _choice_sel[0] = 0
        elif badge.pressed(BUTTON_DOWN):
            _choice_sel[0] = 1

        if badge.pressed(BUTTON_B):
            if _choice_sel[0] == 0:
                scored_this_round = False
                state = GS.WIN
                start_portrait_text(SCENARIOS[scenario_idx]["win_text"], SCENARIOS[scenario_idx]["narrator"][0], SCENARIOS[scenario_idx]["narrator"][1])
                gc.collect()
            else:
                state = GS.LOSE
                start_portrait_text(SCENARIOS[scenario_idx]["lose_text"], SCENARIOS[scenario_idx]["narrator"][0], SCENARIOS[scenario_idx]["narrator"][1])
                gc.collect()
            _choice_sel[0] = 0

    # ── WIN ───────────────────────────────────────────────────────────────────
    elif state == GS.WIN:
        if not scored_this_round:
            score += 1
            scored_this_round = True
        sc = SCENARIOS[scenario_idx]
        screen.blit(IMG_PORT[scenario_idx], vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 208, 320, 32)

        _draw_type_box()
        _render_page_lines(_page_texts[_page_idx[0]])

        can_back    = _page_idx[0] > 0
        can_forward = _page_idx[0] < len(_page_texts) - 1
        _draw_control_hints(can_back, can_forward)

        if badge.pressed(BUTTON_A) and can_back:
            _page_idx[0] -= 1
        elif badge.pressed(BUTTON_C) and can_forward:
            _page_idx[0] += 1

        if _page_idx[0] == len(_page_texts) - 1:
            prompt_blink("PRESS ANY BUTTON", 117)
            if any_button():
                _portrait_mode[0] = False
                _narrator[0] = ""
                _narrator[1] = ""
                scenario_idx += 1
                scored_this_round = False
                if scenario_idx >= len(SCENARIOS):
                    state = GS.FINAL
                    verdict_text = {
                        5: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nPerfect score. You actually understand your systems. Either you work at Honeycomb or you're lying. Either way, welcome to the future.",
                        4: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nFour out of five. Solid. One bad call but you caught it fast. That's what observability is for.",
                        3: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nThree out of five. Not flying blind, just... partially blind. There's a better way and it's at honeycomb.io.",
                        2: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nTwo out of five. Your on-call rotation hates you and they're right to. Dashboards are not observability.",
                        1: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nOne out of five. ONE. I am begging you. Please. Call us. honeycomb.io",
                        0: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nZero. You got zero. I don't know how you're still employed but I respect the chaos. Call Honeycomb. Now. honeycomb.io",
                    }.get(score, "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nCall Honeycomb. honeycomb.io")
                    start_portrait_text(verdict_text, "CHARITY MAJORS", "CTO & CO-FOUNDER")
                else:
                    intro_idx = 0
                    _type_header[0] = ""
                    _type_header[1] = ""
                    start_text(SCENARIOS[scenario_idx]["intro"][0]["text"])
                    state = GS.INTRO
                gc.collect()

    # ── LOSE ──────────────────────────────────────────────────────────────────
    elif state == GS.LOSE:
        sc = SCENARIOS[scenario_idx]
        screen.blit(IMG_PORT[scenario_idx], vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 208, 320, 32)

        _draw_type_box()
        _render_page_lines(_page_texts[_page_idx[0]])

        can_back    = _page_idx[0] > 0
        can_forward = _page_idx[0] < len(_page_texts) - 1
        _draw_control_hints(can_back, can_forward)

        if badge.pressed(BUTTON_A) and can_back:
            _page_idx[0] -= 1
        elif badge.pressed(BUTTON_C) and can_forward:
            _page_idx[0] += 1

        if _page_idx[0] == len(_page_texts) - 1:
            prompt_blink("PRESS ANY BUTTON", 117)
            if any_button():
                _portrait_mode[0] = False
                _narrator[0] = ""
                _narrator[1] = ""
                scenario_idx += 1
                scored_this_round = False
                if scenario_idx >= len(SCENARIOS):
                    state = GS.FINAL
                    verdict_text = {
                        5: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nPerfect score. You actually understand your systems. Either you work at Honeycomb or you're lying. Either way, welcome to the future.",
                        4: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nFour out of five. Solid. One bad call but you caught it fast. That's what observability is for.",
                        3: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nThree out of five. Not flying blind, just... partially blind. There's a better way and it's at honeycomb.io.",
                        2: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nTwo out of five. Your on-call rotation hates you and they're right to. Dashboards are not observability.",
                        1: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nOne out of five. ONE. I am begging you. Please. Call us. honeycomb.io",
                        0: "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nZero. You got zero. I don't know how you're still employed but I respect the chaos. Call Honeycomb. Now. honeycomb.io",
                    }.get(score, "CHARITY MAJORS\nCTO & CO-FOUNDER\n\nCall Honeycomb. honeycomb.io")
                    start_portrait_text(verdict_text, "CHARITY MAJORS", "CTO & CO-FOUNDER")
                else:
                    intro_idx = 0
                    _type_header[0] = ""
                    _type_header[1] = ""
                    start_text(SCENARIOS[scenario_idx]["intro"][0]["text"])
                    state = GS.INTRO
                gc.collect()

    # ── FINAL SCORE ───────────────────────────────────────────────────────────
    elif state == GS.FINAL:
        screen.blit(IMG_CHARITY, vec2(0, 0))
        screen.pen = color.rgb(37, 48, 62)
        screen.rectangle(0, 208, 320, 32)

        _draw_type_box()
        _render_page_lines(_page_texts[_page_idx[0]])

        can_back    = _page_idx[0] > 0
        can_forward = _page_idx[0] < len(_page_texts) - 1
        _draw_control_hints(can_back, can_forward)

        if badge.pressed(BUTTON_A) and can_back:
            _page_idx[0] -= 1
        elif badge.pressed(BUTTON_C) and can_forward:
            _page_idx[0] += 1

        if _page_idx[0] == len(_page_texts) - 1:
            if blink():
                py = 149
                screen.pen = color.rgb(249, 110, 16)
                screen.rectangle(88, py, 144, 22)
                screen.pen = color.rgb(0, 0, 0)
                screen.rectangle(89, py + 1, 142, 20)
                screen.pen = color.rgb(20, 20, 30)
                screen.rectangle(90, py + 2, 140, 18)
                screen.font = small_font
                screen.pen = color.rgb(100, 186, 0)
                tw, _ = screen.measure_text("[ PLAY AGAIN? ]")
                screen.text("[ PLAY AGAIN? ]", vec2(160 - tw // 2, py + 3))
            if any_button():
                state        = GS.TITLE
                score        = 0
                scenario_idx = 0
                intro_idx    = 0
                _narrator[0] = ""
                _narrator[1] = ""
                _portrait_mode[0] = False
                gc.collect()


def init():
    pass


def on_exit():
    pass


try:
    init()
    run(update)
except Exception as e:
    _write_top_level_error("RUN-TIME EXCEPTION", e)
    raise
