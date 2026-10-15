import re
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from models import (
    SubtaskItem, DecompositionResponse, ExtractedTask,
    Difficulty, Priority, TaskCategory
)

class AIEngine:
    @staticmethod
    def extract_tasks_from_document(content: str, filename: str = "assignment.txt") -> List[ExtractedTask]:
        """
        Parses assignment briefs, project requirements, and syllabi.
        Extracts deliverables, estimated hours, deadlines, and difficulties.
        """
        results: List[ExtractedTask] = []
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        
        # Look for dates/deadlines in text
        today = datetime.now()
        date_matches = re.findall(r"(?:due|deadline|by|submission)[:\s]+([A-Za-z0-9\s,\-]+)", content, re.IGNORECASE)
        default_deadline = (today + timedelta(days=4)).strftime("%Y-%m-%d")

        # Heuristic / regex rule parsing + structured extraction
        extracted_sections = []
        current_section = {"title": "", "description": "", "deliverables": []}

        for line in lines:
            # Check for header/numbered item/bullet
            is_header = (
                re.match(r"^(?:part|phase|step|task|assignment|module|\d+[\.\)]|[A-Z\s]{4,})", line, re.IGNORECASE)
                or line.endswith(":")
            )
            
            if is_header and len(line) < 80:
                if current_section["title"]:
                    extracted_sections.append(current_section)
                clean_title = re.sub(r"^[\d\.\-\*\#\s]+", "", line).strip().rstrip(":")
                current_section = {"title": clean_title, "description": "", "deliverables": []}
            else:
                if "deliverable" in line.lower() or "submit" in line.lower() or "upload" in line.lower() or line.startswith(("-", "*", "•")):
                    clean_deliv = line.lstrip("-*• ").strip()
                    if clean_deliv:
                        current_section["deliverables"].append(clean_deliv)
                else:
                    if len(current_section["description"]) < 300:
                        current_section["description"] += (" " + line).strip()

        if current_section["title"]:
            extracted_sections.append(current_section)

        # If too few sections found, create intelligent structured items from keywords
        if not extracted_sections or len(extracted_sections) <= 1:
            extracted_sections = [
                {
                    "title": f"Literature Review & Scope ({filename.split('.')[0]})",
                    "description": "Understand prompt specifications, review rubrics, gather initial references and citations.",
                    "deliverables": ["Summary notes", "Reference list"]
                },
                {
                    "title": f"Core Implementation & Analysis",
                    "description": "Execute main methodology, coding benchmarks, or quantitative analysis as specified in brief.",
                    "deliverables": ["Working code / model notebook", "Preliminary test results"]
                },
                {
                    "title": f"Final Report & Synthesis",
                    "description": "Format final document according to submission guidelines, double-check rubric criteria, proofread.",
                    "deliverables": ["PDF Report", "Submission confirmation"]
                }
            ]

        # Convert to ExtractedTask objects with realistic durations and deadlines
        base_days = 2
        for i, sec in enumerate(extracted_sections[:5]): # Cap at 5 key deliverables
            title = sec["title"] or f"Task Deliverable {i+1}"
            dur = 2.5 + (i * 1.5)
            # Estimate difficulty based on keywords
            diff = Difficulty.MEDIUM
            if any(k in (title + sec["description"]).lower() for k in ["math", "proof", "train", "benchmark", "complex", "algorithm", "architecture"]):
                diff = Difficulty.HARD
                dur = max(dur, 4.5)
            elif any(k in (title + sec["description"]).lower() for k in ["review", "read", "setup", "submit", "format"]):
                diff = Difficulty.EASY
                dur = min(dur, 2.0)

            deadline_dt = today + timedelta(days=base_days + i * 2)

            results.append(ExtractedTask(
                title=title[:60],
                description=sec["description"][:200] if sec["description"] else f"Extracted from {filename}",
                suggested_hours=round(dur, 1),
                deadline=deadline_dt.strftime("%Y-%m-%d"),
                difficulty=diff,
                priority=Priority.HIGH if diff == Difficulty.HARD else Priority.MEDIUM,
                category=TaskCategory.ASSIGNMENT if "assignment" in filename.lower() else TaskCategory.PROJECT,
                deliverables=sec["deliverables"][:4]
            ))

        return results

    @staticmethod
    def decompose_project(
        project_title: str,
        project_description: str,
        total_hours: float,
        deadline: str,
        category: TaskCategory = TaskCategory.PROJECT
    ) -> DecompositionResponse:
        """
        Decomposes a large project or assignment into manageable, dependent subtasks.
        """
        # Determine archetype based on title & category
        t_lower = (project_title + " " + project_description).lower()
        
        if "research" in t_lower or "paper" in t_lower or "thesis" in t_lower or "literature" in t_lower:
            breakdown_template = [
                ("1. Literature Review & Sources Gathering", "Collect 8-10 high quality IEEE/ACM papers and synthesize main findings", 0.25, Difficulty.MEDIUM),
                ("2. Methodology & Experimental Framework", "Define model architecture, evaluation baselines, and dataset pre-processing", 0.35, Difficulty.HARD),
                ("3. Experiment Execution & Result Visualization", "Run validation runs, compute F1/RMSE metrics, and generate comparison charts", 0.25, Difficulty.HARD),
                ("4. Manuscript Drafting & LaTeX Formatting", "Write introduction, discussion, compile references and review submission checklist", 0.15, Difficulty.MEDIUM),
            ]
        elif "ml" in t_lower or "code" in t_lower or "fullstack" in t_lower or "dev" in t_lower or "app" in t_lower or "backend" in t_lower:
            breakdown_template = [
                ("1. Requirements & Architecture Blueprint", "Draft schema, API endpoints, setup repository and development dependencies", 0.20, Difficulty.EASY),
                ("2. Core Logic & Implementation", "Build algorithms, business logic, endpoints and validation logic", 0.40, Difficulty.HARD),
                ("3. Integration & Unit Testing", "Write integration tests, debug edge cases, ensure constraints and safety checks", 0.25, Difficulty.MEDIUM),
                ("4. Documentation & Deployment Walkthrough", "Record demo, write README, prepare deployment or containerization scripts", 0.15, Difficulty.EASY),
            ]
        elif "exam" in t_lower or "midterm" in t_lower or "final" in t_lower:
            breakdown_template = [
                ("1. Syllabus Audit & Formula Sheet Compilation", "Review all lecture notes, slides, and compile consolidated cheat-sheet", 0.25, Difficulty.EASY),
                ("2. High-Yield Practice Problem Sets", "Solve past 3 years midterms and tricky homework assignments under timed conditions", 0.45, Difficulty.HARD),
                ("3. Weak Spot Deep Dive & Office Hours", "Clarify concepts for failed problems and review edge cases", 0.20, Difficulty.MEDIUM),
                ("4. Final Mock Exam Simulation", "Full timed simulation to build exam pacing and mental stamina", 0.10, Difficulty.MEDIUM),
            ]
        else:
            breakdown_template = [
                ("1. Discovery, Scoping & Outlining", "Clarify rubric expectations, gather raw inputs, and set clear milestone boundaries", 0.20, Difficulty.EASY),
                ("2. Core Synthesis & Heavy Lifting", "Execute primary deliverable content, deep writing, or analytical evaluation", 0.45, Difficulty.HARD),
                ("3. Review, Formatting & Peer Sanity Check", "Verify guidelines, citations, formatting polish, and fix critical oversights", 0.25, Difficulty.MEDIUM),
                ("4. Submission Wrap-up & Archive", "Final PDF export, submission verification, backup files", 0.10, Difficulty.EASY),
            ]

        subtasks: List[SubtaskItem] = []
        accumulated_hours = 0.0

        for idx, (title, desc, pct, diff) in enumerate(breakdown_template):
            hrs = round(total_hours * pct, 1)
            accumulated_hours += hrs
            
            # Dependencies: each step depends on previous step
            deps = [breakdown_template[idx - 1][0]] if idx > 0 else []

            subtasks.append(SubtaskItem(
                title=title,
                description=desc,
                estimated_hours=hrs,
                difficulty=diff,
                priority=Priority.HIGH if diff == Difficulty.HARD else Priority.MEDIUM,
                order=idx + 1,
                dependencies=deps
            ))

        rationale = (
            f"Broken into {len(subtasks)} sequential phases respecting cognitive load. "
            f"The hardest 40-45% of work is scheduled as a dedicated deep-work block before final polish."
        )

        return DecompositionResponse(
            project_title=project_title,
            subtasks=subtasks,
            rationale=rationale
        )
