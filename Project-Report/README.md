# ComplexityUniverse — Academic Project Report Package

This directory contains the complete academic project report, ER diagrams, LaTeX sources, and markdown documentation for **ComplexityUniverse: AI-Powered Algorithmic Time & Space Complexity Analysis Platform**.

---

## Directory Structure

```
Project-Report/
├── Project-report.tex       # Complete Academic LaTeX Report (1,700+ lines, Chapters 1–11 + Appendices)
├── main.tex                 # Original DBMS Project Template format provided for reference
├── report.md                # Markdown documentation version of the report
├── NotionReport.md          # Comprehensive Notion-style technical report
├── Code Analysis Data Lifecycle Flowchart.png # Algorithmic Analysis Execution Lifecycle Flowchart
├── High-Level Architecture Diagram.png       # Full-Stack Architecture Diagram
├── README.md                # Documentation and guide
└── assets/                  # High-resolution ER diagrams and subsystem schematics
    ├── Code Analysis Data Lifecycle Flowchart.png # Lifecycle flowchart asset copy
    ├── High-Level Architecture Diagram.png       # Architecture diagram asset copy
    ├── Fig 1.1.png          # Type 1: Complete Conceptual ER Diagram (Peter Chen Notation)
    ├── Fig 1.2.png          # Type 1: Subsystem 1 (Users, Profiles, Activity Log)
    ├── Fig 1.3.png          # Type 1: Subsystem 2 (Code Analysis & AI Prompts)
    ├── Fig 1.4.png          # Type 1: Subsystem 3 (Curriculum Topics & Bookmarks)
    ├── Fig 1.5.png          # Type 1: Subsystem 4 (System Administration & Prompts)
    ├── Fig 2.2.png          # Type 2: Relational Subsystem 1 (Identity & Profile Schema)
    ├── Fig 2.3.png          # Type 2: Relational Subsystem 2 (Code Analysis Schema)
    ├── Fig 2.4.png          # Type 2: Relational Subsystem 3 (Educational Library Schema)
    ├── Fig 2.5.png          # Type 2: Relational Subsystem 4 (System Administration Schema)
    └── newER - Diagrams/    # Raw exported diagram assets
```

---

## Team Details & Scholar Numbers

| Name | Scholar Number | Project Contributions |
| :--- | :--- | :--- |
| **Animesh Gupta** | `25U024044` | Project Lead, Complete System Architecture & Implementation, MySQL Database Design, AI Gateway Integration, Complete Project Report, Conceptual & Relational ER Modeling |
| **Ritik Raj** | `25U024041` | Entity--Relationship Modeling & ER Diagram Drafting |
| **Aditya Chaudhary** | `25U024045` | Sample Code Collection & Basic Testing Assistance |
| **Gaurav Kumar Singh** | `25U024043` | Project Presentation Slide Deck (`Project Presentation.ppt`), Presentation Structure & Design |

---

## Seeded Database Accounts

The database seed (`database/seed.sql`) provisions credentials for testing and academic evaluation:

- **Site Admin:** `admin@complexityuniverse.dev` (`admin123`)
- **System Admin:** `admin@complexity.io` (`admin123`)
- **Demo User:** `demo@complexityuniverse.dev` (`demo1234`)
- **Student Accounts:** `animesh@iiitbhopal.ac.in`, `ritik@iiitbhopal.ac.in`, `aditya@iiitbhopal.ac.in`, `gaurav@iiitbhopal.ac.in` (`user123`)

---

## How to Compile `Project-report.tex`

### Option 1: 1-Click Automated Compiler (Recommended)
Run the bundled compiler script which bundles and embeds all 27 diagram & UI screenshot assets and outputs `Project-report.pdf`:
```bash
python compile_pdf.py
```

### Option 2: Overleaf
1. Create a new Overleaf project.
2. Upload `Project-report.tex` and the `assets/` folder.
3. Ensure compiler is set to **pdfLaTeX** or **XeLaTeX** (default engine).
4. Click **Recompile**.

### Option 3: Local LaTeX (TeXLive / MiKTeX)
```bash
pdflatex Project-report.tex
pdflatex Project-report.tex
```
*(Running twice resolves all Table of Contents and figure cross-references).*
