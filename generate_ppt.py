import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(output_path):
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    COLOR_MIDNIGHT = RGBColor(21, 26, 45)      # #151A2D
    COLOR_LAVENDER = RGBColor(136, 120, 245)   # #8878F5
    COLOR_LIGHT_BG = RGBColor(245, 243, 255)   # #F5F3FF
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_DARK_TEXT = RGBColor(30, 41, 59)     # #1E293B
    COLOR_MUTED = RGBColor(100, 116, 139)      # #64748B
    COLOR_CARD_BORDER = RGBColor(229, 224, 250)# #E5E0FA
    COLOR_MINT = RGBColor(16, 185, 129)        # #10B981
    COLOR_ROSE = RGBColor(244, 63, 94)         # #F43F5E
    COLOR_AMBER = RGBColor(245, 158, 11)       # #F59E0B

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.fill.background()
        return bg

    def add_header(slide, tag_text, title_text, dark=False):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(8.0), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = tag_text.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.name = "Arial"
        p_tag.font.color.rgb = COLOR_LAVENDER if not dark else COLOR_MINT

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.5), Inches(0.8))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.name = "Arial"
        p_title.font.color.rgb = COLOR_WHITE if dark else COLOR_MIDNIGHT

    def add_card(slide, left, top, width, height, bg_color=COLOR_WHITE, border_color=COLOR_CARD_BORDER):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        if border_color:
            card.line.color.rgb = border_color
            card.line.width = Pt(1.5)
        else:
            card.line.fill.background()
        return card

    # ==========================================
    # SLIDE 1: TITLE SLIDE (Lady Bugs & TaskTide)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, COLOR_MIDNIGHT)

    # Decorative accent card
    accent = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(0.15), Inches(4.5))
    accent.fill.solid()
    accent.fill.fore_color.rgb = COLOR_LAVENDER
    accent.line.fill.background()

    # Title box
    tb = s1.shapes.add_textbox(Inches(1.2), Inches(1.4), Inches(11.0), Inches(2.2))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p = tf.paragraphs[0]
    p.text = "TaskTide"
    p.font.size = Pt(50)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE
    p.font.name = "Arial"

    p2 = tf.add_paragraph()
    p2.text = "Intelligent Workload Planning & Constraint-Based Scheduling System"
    p2.font.size = Pt(20)
    p2.font.color.rgb = COLOR_LAVENDER
    p2.font.name = "Arial"
    p2.space_before = Pt(10)

    p3 = tf.add_paragraph()
    p3.text = "A Mathematical Feasibility Platform Moving Beyond Passive To-Do Tracking"
    p3.font.size = Pt(13)
    p3.font.color.rgb = COLOR_MUTED
    p3.font.name = "Arial"
    p3.space_before = Pt(8)

    # Team Info Card (Lady Bugs)
    team_card = add_card(s1, Inches(1.2), Inches(4.2), Inches(6.0), Inches(2.0), COLOR_MIDNIGHT, COLOR_LAVENDER)
    t_box = s1.shapes.add_textbox(Inches(1.5), Inches(4.35), Inches(5.4), Inches(1.7))
    t_tf = t_box.text_frame
    t_tf.word_wrap = True

    p_team_tag = t_tf.paragraphs[0]
    p_team_tag.text = "DEVELOPED BY"
    p_team_tag.font.size = Pt(10)
    p_team_tag.font.bold = True
    p_team_tag.font.color.rgb = COLOR_MINT
    p_team_tag.font.name = "Arial"

    p_team_name = t_tf.add_paragraph()
    p_team_name.text = "Team: Lady Bugs"
    p_team_name.font.size = Pt(20)
    p_team_name.font.bold = True
    p_team_name.font.color.rgb = COLOR_WHITE
    p_team_name.font.name = "Arial"
    p_team_name.space_before = Pt(4)

    p_members = t_tf.add_paragraph()
    p_members.text = "Team Members: Sanjana Rajasekar & Anugraha P J"
    p_members.font.size = Pt(14)
    p_members.font.color.rgb = COLOR_LAVENDER
    p_members.font.name = "Arial"
    p_members.space_before = Pt(6)

    # Tag Badge
    badge_card = add_card(s1, Inches(7.5), Inches(4.2), Inches(4.7), Inches(2.0), RGBColor(30, 36, 60), None)
    b_box = s1.shapes.add_textbox(Inches(7.8), Inches(4.45), Inches(4.1), Inches(1.5))
    b_tf = b_box.text_frame
    b_tf.word_wrap = True

    pb1 = b_tf.paragraphs[0]
    pb1.text = "🎯 Core Differentiators"
    pb1.font.size = Pt(14)
    pb1.font.bold = True
    pb1.font.color.rgb = COLOR_WHITE
    pb1.font.name = "Arial"

    bullets = [
        "Google OR-Tools CP-SAT Solver",
        "Honest Infeasibility & Deficit Flagging",
        "Non-Overlapping Fixed vs. Flexible Grid",
        "Personalized Duration Drift Calibration"
    ]
    for b in bullets:
        pb = b_tf.add_paragraph()
        pb.text = f"• {b}"
        pb.font.size = Pt(11)
        pb.font.color.rgb = RGBColor(203, 213, 225)
        pb.font.name = "Arial"
        pb.space_before = Pt(3)

    # ==========================================
    # SLIDE 2: PROBLEM STATEMENT
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, COLOR_LIGHT_BG)
    add_header(s2, "The Real-World Challenge", "Problem Statement: The Illusion of Feasibility")

    # Overview Banner
    add_card(s2, Inches(0.8), Inches(1.7), Inches(11.733), Inches(1.15), COLOR_WHITE, COLOR_ROSE)
    ob_box = s2.shapes.add_textbox(Inches(1.05), Inches(1.8), Inches(11.2), Inches(0.95))
    ob_tf = ob_box.text_frame
    ob_tf.word_wrap = True
    p_ob = ob_tf.paragraphs[0]
    p_ob.text = "Existing productivity tools (Todoist, Notion, Trello, Google Calendar) track WHAT is due and WHEN, but are mathematically blind to time capacity. They allow users to plan 35 hours of work into a window that only has 12 free hours, leading directly to deadline panics, sleep deprivation, and burnout."
    p_ob.font.size = Pt(13)
    p_ob.font.color.rgb = COLOR_DARK_TEXT
    p_ob.font.name = "Arial"

    # 4 Problem Column Cards
    col_width = Inches(2.78)
    col_gap = Inches(0.2)
    left_start = Inches(0.8)
    cards_top = Inches(3.1)
    card_h = Inches(3.8)

    problems = [
        ("Capacity Blindness", "No Cumulative Math", "Checklists treat tasks in isolation, failing to compute the cumulative hours required versus available unblocked hours before cutoff dates.", COLOR_ROSE),
        ("Schedule Collisions", "Fixed vs. Flexible Clash", "Users struggle to reconcile unmovable commitments (lectures, labs, shifts) with flexible tasks, causing constant manual re-planning.", COLOR_AMBER),
        ("Cascading Failures", "No What-If Insight", "A single unexpected 3-hour lab or sick day silently cascades across the entire week, breaking downstream deadlines without any advance warning.", COLOR_LAVENDER),
        ("Planning Fallacy", "20-30% Underestimation", "Humans systematically underestimate technical deliverables (coding, problem sets), collapsing tight schedules mid-week without empirical safety buffers.", COLOR_MIDNIGHT)
    ]

    for i, (title, sub, desc, color) in enumerate(problems):
        x = left_start + i * (col_width + col_gap)
        add_card(s2, x, cards_top, col_width, card_h, COLOR_WHITE, COLOR_CARD_BORDER)
        
        # Color top bar
        c_bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, cards_top, col_width, Inches(0.12))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = color
        c_bar.line.fill.background()

        c_box = s2.shapes.add_textbox(x + Inches(0.2), cards_top + Inches(0.3), col_width - Inches(0.4), card_h - Inches(0.5))
        c_tf = c_box.text_frame
        c_tf.word_wrap = True

        cp1 = c_tf.paragraphs[0]
        cp1.text = title
        cp1.font.size = Pt(16)
        cp1.font.bold = True
        cp1.font.color.rgb = COLOR_MIDNIGHT
        cp1.font.name = "Arial"

        cp2 = c_tf.add_paragraph()
        cp2.text = sub.upper()
        cp2.font.size = Pt(10)
        cp2.font.bold = True
        cp2.font.color.rgb = color
        cp2.font.name = "Arial"
        cp2.space_before = Pt(4)

        cp3 = c_tf.add_paragraph()
        cp3.text = desc
        cp3.font.size = Pt(12)
        cp3.font.color.rgb = COLOR_MUTED
        cp3.font.name = "Arial"
        cp3.space_before = Pt(12)

    # ==========================================
    # SLIDE 3: PROPOSED SOLUTION
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, COLOR_LIGHT_BG)
    add_header(s3, "Mathematical Decision Support", "Proposed Solution: TaskTide Intelligent System")

    # Solution intro
    add_card(s3, Inches(0.8), Inches(1.7), Inches(11.733), Inches(1.05), COLOR_WHITE, COLOR_LAVENDER)
    s_box = s3.shapes.add_textbox(Inches(1.05), Inches(1.8), Inches(11.2), Inches(0.85))
    s_tf = s_box.text_frame
    s_tf.word_wrap = True
    sp = s_tf.paragraphs[0]
    sp.text = "TaskTide is a full-stack workload feasibility platform powered by Google OR-Tools CP-SAT. It calculates mathematically exact capacity margins, locks unmovable commitments, and generates multi-strategy conflict-free schedules that eliminate all-nighters."
    sp.font.size = Pt(13)
    sp.font.color.rgb = COLOR_DARK_TEXT
    sp.font.name = "Arial"

    # 3 Strategy Cards
    c3_w = Inches(3.75)
    c3_gap = Inches(0.24)
    c3_top = Inches(3.0)
    c3_h = Inches(3.9)

    strategies = [
        ("Deadline-First Strategy", "Risk Minimization", [
            "Prioritizes tasks with earliest upcoming cutoffs.",
            "Eliminates late-submission penalty risks.",
            "Calculates cumulative safety cushion before deadlines.",
            "Ideal for high-stakes assignment weeks."
        ], COLOR_ROSE),
        ("Balanced Workload", "Burnout Prevention", [
            "Flattens daily work hours to ~4.5 - 5.5 hours/day.",
            "Eliminates 14-hour crunch days and panic cramming.",
            "Smooths cognitive strain across the entire week.",
            "Ideal for sustainable study habits & health."
        ], COLOR_MINT),
        ("Focus-First Deep Work", "High-Energy Allocation", [
            "Reserves morning hours (09:00 - 13:00) for deep focus.",
            "Batches hard technical coding/math into contiguous slots.",
            "Keeps afternoons open for meetings and reviews.",
            "Ideal for intense software engineering & thesis."
        ], COLOR_LAVENDER)
    ]

    for i, (title, sub, points, color) in enumerate(strategies):
        x = Inches(0.8) + i * (c3_w + c3_gap)
        add_card(s3, x, c3_top, c3_w, c3_h, COLOR_WHITE, COLOR_CARD_BORDER)

        s_bar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, c3_top, c3_w, Inches(0.12))
        s_bar.fill.solid()
        s_bar.fill.fore_color.rgb = color
        s_bar.line.fill.background()

        sc_box = s3.shapes.add_textbox(x + Inches(0.25), c3_top + Inches(0.3), c3_w - Inches(0.5), c3_h - Inches(0.5))
        sc_tf = sc_box.text_frame
        sc_tf.word_wrap = True

        p1 = sc_tf.paragraphs[0]
        p1.text = title
        p1.font.size = Pt(17)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_MIDNIGHT
        p1.font.name = "Arial"

        p2 = sc_tf.add_paragraph()
        p2.text = sub.upper()
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = color
        p2.font.name = "Arial"
        p2.space_before = Pt(4)

        for pt in points:
            p_pt = sc_tf.add_paragraph()
            p_pt.text = f"• {pt}"
            p_pt.font.size = Pt(12)
            p_pt.font.color.rgb = COLOR_DARK_TEXT
            p_pt.font.name = "Arial"
            p_pt.space_before = Pt(8)

    # ==========================================
    # SLIDE 4: INNOVATION & KEY DIFFERENTIATORS
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, COLOR_LIGHT_BG)
    add_header(s4, "Competitive Edge", "Key Innovations: Moving Beyond Static Planners")

    innovations = [
        ("1. Honest Infeasibility Reporting", "Refusal of Fake Schedules", "When workload exceeds capacity, TaskTide refuses to generate a fictitious calendar. It pinpoints the exact deficit (e.g., -7.0h before Wednesday) and specifies which tasks must be negotiated or rescoped.", COLOR_ROSE),
        ("2. Constraint Optimization (OR-Tools)", "Google CP-SAT Solver", "Models scheduling as a formal Constraint Satisfaction Problem: IntervalVars, non-overlapping NoOverlap constraints, precedences, and variable daily energy limits.", COLOR_LAVENDER),
        ("3. 'What-If' Scenario Sandbox", "Interactive Ripple Simulation", "Simulate adding a surprise 4-hour lab or falling ill on Tuesday. TaskTide re-solves in 40ms and previews displaced tasks and burnout delta before committing changes.", COLOR_MINT),
        ("4. Duration Learning Calibration", "Anti-Planning Fallacy", "Tracks estimated vs. actual durations. Calculates category multipliers (e.g., Coding tasks +28% drift) and injects empirical safety cushions into the optimization solver.", COLOR_AMBER)
    ]

    grid_w = Inches(5.7)
    grid_h = Inches(2.35)

    coords = [
        (Inches(0.8), Inches(1.8)),
        (Inches(6.8), Inches(1.8)),
        (Inches(0.8), Inches(4.5)),
        (Inches(6.8), Inches(4.5))
    ]

    for (x, y), (title, sub, desc, col) in zip(coords, innovations):
        add_card(s4, x, y, grid_w, grid_h, COLOR_WHITE, COLOR_CARD_BORDER)

        ib = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Inches(0.12), grid_h)
        ib.fill.solid()
        ib.fill.fore_color.rgb = col
        ib.line.fill.background()

        it_box = s4.shapes.add_textbox(x + Inches(0.35), y + Inches(0.2), grid_w - Inches(0.55), grid_h - Inches(0.35))
        it_tf = it_box.text_frame
        it_tf.word_wrap = True

        ip1 = it_tf.paragraphs[0]
        ip1.text = title
        ip1.font.size = Pt(16)
        ip1.font.bold = True
        ip1.font.color.rgb = COLOR_MIDNIGHT
        ip1.font.name = "Arial"

        ip2 = it_tf.add_paragraph()
        ip2.text = sub.upper()
        ip2.font.size = Pt(10)
        ip2.font.bold = True
        ip2.font.color.rgb = col
        ip2.font.name = "Arial"
        ip2.space_before = Pt(3)

        ip3 = it_tf.add_paragraph()
        ip3.text = desc
        ip3.font.size = Pt(11.5)
        ip3.font.color.rgb = COLOR_MUTED
        ip3.font.name = "Arial"
        ip3.space_before = Pt(6)

    # ==========================================
    # SLIDE 5: TECHNOLOGY STACK
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, COLOR_LIGHT_BG)
    add_header(s5, "System Architecture", "Technology Stack: High-Performance Architecture")

    tech_cols = [
        ("Frontend Application", "User Interface & Interactions", [
            ("React 19 & TypeScript", "Type-safe UI with strict compilation"),
            ("Tailwind CSS v4", "High-speed utility-first design system"),
            ("Framer Motion", "Physics-based spring micro-interactions"),
            ("Canvas Confetti", "Dopamine-driven task completion bursts"),
            ("Lucide Icons", "Crisp vector icons and status badges")
        ], COLOR_LAVENDER),
        ("Backend Services", "API & Scheduling Engine", [
            ("FastAPI (Python 3.11)", "High-throughput asynchronous REST API"),
            ("Google OR-Tools CP-SAT", "Constraint programming optimization solver"),
            ("Pydantic v2", "Strict schema validation and data serialization"),
            ("Uvicorn ASGI", "Lightning-fast production ASGI server"),
            ("Custom AIEngine", "Syllabus parsing & project decomposer")
        ], COLOR_MIDNIGHT),
        ("Data, Security & Deploy", "Persistence & Cloud", [
            ("SQLite & SQLAlchemy 2.0", "Embedded relational DB with ORM mapping"),
            ("PBKDF2 Password Salt", "Cryptographic password hashing (HMAC-SHA256)"),
            ("JWT Authentication", "Stateless bearer token authorization"),
            ("Vercel & Git Monorepo", "Zero-config edge deployment with SPA routing"),
            ("Local Fallback Engine", "100% functional standalone client preview")
        ], COLOR_MINT)
    ]

    t_w = Inches(3.75)
    t_gap = Inches(0.24)
    t_top = Inches(1.8)
    t_h = Inches(5.1)

    for i, (col_title, col_sub, items, col) in enumerate(tech_cols):
        x = Inches(0.8) + i * (t_w + t_gap)
        add_card(s5, x, t_top, t_w, t_h, COLOR_WHITE, COLOR_CARD_BORDER)

        t_bar = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, t_top, t_w, Inches(0.12))
        t_bar.fill.solid()
        t_bar.fill.fore_color.rgb = col
        t_bar.line.fill.background()

        tb_box = s5.shapes.add_textbox(x + Inches(0.25), t_top + Inches(0.25), t_w - Inches(0.5), t_h - Inches(0.4))
        tb_tf = tb_box.text_frame
        tb_tf.word_wrap = True

        p1 = tb_tf.paragraphs[0]
        p1.text = col_title
        p1.font.size = Pt(17)
        p1.font.bold = True
        p1.font.color.rgb = COLOR_MIDNIGHT
        p1.font.name = "Arial"

        p2 = tb_tf.add_paragraph()
        p2.text = col_sub.upper()
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = col
        p2.font.name = "Arial"
        p2.space_before = Pt(3)

        for name, detail in items:
            p_name = tb_tf.add_paragraph()
            p_name.text = f"• {name}"
            p_name.font.size = Pt(12)
            p_name.font.bold = True
            p_name.font.color.rgb = COLOR_DARK_TEXT
            p_name.font.name = "Arial"
            p_name.space_before = Pt(8)

            p_det = tb_tf.add_paragraph()
            p_det.text = f"   {detail}"
            p_det.font.size = Pt(10)
            p_det.font.color.rgb = COLOR_MUTED
            p_det.font.name = "Arial"
            p_det.space_before = Pt(1)

    # ==========================================
    # SLIDE 6: FEASIBILITY & EXPECTED IMPACT
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, COLOR_LIGHT_BG)
    add_header(s6, "Viability & Outcomes", "Feasibility & Expected Impact")

    # Left: Feasibility Cards
    f_w = Inches(5.7)
    f_h = Inches(2.4)

    feasibility_points = [
        ("Technical & Computational Feasibility", "Deterministic & High Speed", [
            "Google OR-Tools CP-SAT solves 15-20 deliverables with 50+ slot constraints in < 50 milliseconds.",
            "Zero heavy infrastructure required; runs on lightweight CPU hardware without GPUs.",
            "Client fallback guarantees 100% uptime even during network disconnections."
        ], COLOR_MINT),
        ("Operational & Market Feasibility", "Zero Behavioral Resistance", [
            "Integrates directly into existing academic workflows (syllabus PDF upload, calendar slots).",
            "Eliminates cognitive friction of manual drag-and-drop scheduling.",
            "Zero vendor lock-in; exports clean schedule snapshots."
        ], COLOR_LAVENDER)
    ]

    for idx, (f_title, f_sub, f_bullets, f_col) in enumerate(feasibility_points):
        y = Inches(1.8) + idx * (f_h + Inches(0.25))
        add_card(s6, Inches(0.8), y, f_w, f_h, COLOR_WHITE, COLOR_CARD_BORDER)

        f_bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), y, Inches(0.12), f_h)
        f_bar.fill.solid()
        f_bar.fill.fore_color.rgb = f_col
        f_bar.line.fill.background()

        fbox = s6.shapes.add_textbox(Inches(1.15), y + Inches(0.2), f_w - Inches(0.45), f_h - Inches(0.35))
        ftf = fbox.text_frame
        ftf.word_wrap = True

        fp1 = ftf.paragraphs[0]
        fp1.text = f_title
        fp1.font.size = Pt(15)
        fp1.font.bold = True
        fp1.font.color.rgb = COLOR_MIDNIGHT
        fp1.font.name = "Arial"

        fp2 = ftf.add_paragraph()
        fp2.text = f_sub.upper()
        fp2.font.size = Pt(9.5)
        fp2.font.bold = True
        fp2.font.color.rgb = f_col
        fp2.font.name = "Arial"
        fp2.space_before = Pt(2)

        for b in f_bullets:
            fb = ftf.add_paragraph()
            fb.text = f"• {b}"
            fb.font.size = Pt(11)
            fb.font.color.rgb = COLOR_DARK_TEXT
            fb.font.name = "Arial"
            fb.space_before = Pt(5)

    # Right: Expected Impact Card
    imp_x = Inches(6.8)
    imp_w = Inches(5.733)
    imp_h = Inches(5.05)
    add_card(s6, imp_x, Inches(1.8), imp_w, imp_h, COLOR_WHITE, COLOR_LAVENDER)

    i_bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, imp_x, Inches(1.8), imp_w, Inches(0.12))
    i_bar.fill.solid()
    i_bar.fill.fore_color.rgb = COLOR_LAVENDER
    i_bar.line.fill.background()

    ibox = s6.shapes.add_textbox(imp_x + Inches(0.3), Inches(2.1), imp_w - Inches(0.6), imp_h - Inches(0.5))
    itf = ibox.text_frame
    itf.word_wrap = True

    ip1 = itf.paragraphs[0]
    ip1.text = "Expected Real-World Impact"
    ip1.font.size = Pt(18)
    ip1.font.bold = True
    ip1.font.color.rgb = COLOR_MIDNIGHT
    ip1.font.name = "Arial"

    ip2 = itf.add_paragraph()
    ip2.text = "TRANSFORMING STUDENT PRODUCTIVITY".upper()
    ip2.font.size = Pt(10)
    ip2.font.bold = True
    ip2.font.color.rgb = COLOR_LAVENDER
    ip2.font.name = "Arial"
    ip2.space_before = Pt(3)

    impact_stats = [
        ("Elimination of Panic Cramming", "By detecting capacity gaps 3-5 days in advance, students never discover an impossible workload 6 hours before submission."),
        ("40% Reduction in Academic Burnout", "Workload smoothing caps daily focus effort at 5 hours, eliminating erratic spikes between idle days and 14-hour crunch days."),
        ("100% Conflict-Free Scheduling", "No-overlap constraints guarantee zero collisions between flexible study tasks and fixed university lectures or internship shifts."),
        ("Data-Driven Time Awareness", "Duration calibration educates users on their personal planning fallacy, building lifelong time-management confidence.")
    ]

    for title, desc in impact_stats:
        p_t = itf.add_paragraph()
        p_t.text = f"✔ {title}"
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_MIDNIGHT
        p_t.font.name = "Arial"
        p_t.space_before = Pt(8)

        p_d = itf.add_paragraph()
        p_d.text = f"   {desc}"
        p_d.font.size = Pt(10.5)
        p_d.font.color.rgb = COLOR_MUTED
        p_d.font.name = "Arial"
        p_d.space_before = Pt(1)

    prs.save(output_path)
    print(f"Presentation successfully created at: {output_path}")

if __name__ == "__main__":
    out = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "TaskTide_Presentation.pptx")
    create_deck(out)
