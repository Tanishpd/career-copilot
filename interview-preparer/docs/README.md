# 📁 Documentation

This folder contains all project documentation, architecture diagrams, and screenshots for the AI Tech Interview platform.

---

## 📂 Folder Structure

```
docs/
├── README.md (this file)
├── diagrams/
│   ├── architecture_flow.png
│   └── architecture_system.png
└── screenshots/
    ├── answer-recommendations.png
    ├── form-setup.png
    ├── interview-results.png
    ├── results-by-question.png
    └── score-breakdown.png
```

---

## 🗺️ Diagrams

### Architecture Diagrams

Located in [`diagrams/`](./diagrams/)

| File | Description | Referenced In |
|------|-------------|---------------|
| `architecture_system.png` | **System Architecture** - Shows the hybrid architecture with Next.js app connecting to Azure AI services (OpenAI, Speech). Illustrates the separation between frontend, backend APIs, and cloud services. | [README.md](../README.md#🏗️-architecture) |
| `architecture_flow.png` | **Interview Flow** - Visual representation of the voice-driven interview loop: question display → TTS playback → user recording → STT transcription → AI evaluation → results display. | [README.md](../README.md#🔄-how-it-works) |

### Diagram Details

#### `architecture_system.png`
- **Purpose:** High-level system architecture
- **Components:**
  - Next.js 16 Application (Server + Client Components)
  - Prisma 7 + PostgreSQL Database
  - Azure OpenAI Service (GPT-4o-mini)
  - Azure Speech Service (TTS + STT)
  - IndexedDB for offline storage
- **Key Patterns:**
  - Server Components for data fetching
  - Client Components for interactivity
  - Token-based authentication for Azure services
  - Offline-first architecture with background sync

#### `architecture_flow.png`
- **Purpose:** Interview process flow diagram
- **Stages:**
  1. **Session Setup:** User inputs role, job description, seniority
  2. **Topic Extraction:** AI extracts key topics from job description
  3. **Question Generation:** AI generates role-specific questions
  4. **Interview Loop:**
     - Display question
     - TTS reads question aloud
     - User records response (with visible timer)
     - STT transcribes audio
     - Save response (online or offline)
  5. **Evaluation:** AI evaluates all responses
  6. **Results Display:** Show scores, feedback, improvements

---

## 📸 Screenshots

Located in [`screenshots/`](./screenshots/)

| File | Description | Features Shown |
|------|-------------|----------------|
| `form-setup.png` | **Session Setup Form** - Initial form where users input their target role, company name, and job description. | - Role title input<br>- Company name (optional)<br>- Job description textarea<br>- "Start Interview" CTA button |
| `interview-results.png` | **Interview Results Dashboard** - Overview of all responses with overall score and performance band. | - Overall score badge<br>- Performance band (Excellent/Good/Fair/Needs Improvement)<br>- Session metadata (role, seniority, date)<br>- List of all questions with individual scores<br>- Navigation to detailed feedback |
| `results-by-question.png` | **Question-by-Question Breakdown** - Detailed view of responses for each interview question. | - Question text display<br>- Transcription display<br>- Response duration<br>- Evaluation status indicator |
| `score-breakdown.png` | **Evaluation Score Breakdown** - Visual breakdown of the 6 evaluation criteria with scores. | - Relevance Score (25%)<br>- Technical Accuracy (25%)<br>- Clarity (20%)<br>- Depth (15%)<br>- Structure (10%)<br>- Confidence (5%)<br>- Overall score calculation<br>- Performance band |
| `answer-recommendations.png` | **Feedback & Recommendations** - Detailed feedback section showing strengths, areas for improvement, and actionable suggestions. | - Strengths list (✅ checkmarks)<br>- Improvements list (💡 icons)<br>- Specific suggestion for next steps<br>- Seniority-adjusted expectations<br>- Topic coverage analysis |

### Screenshot Guidelines

When adding new screenshots:
1. **Naming Convention:** Use kebab-case (e.g., `feature-name.png`)
2. **Resolution:** Minimum 1920x1080 for clarity
3. **Format:** PNG with transparency where applicable
4. **Privacy:** Redact any personal/sensitive information
5. **Update This File:** Add entry to the table above with description

---

## 🖼️ Adding New Documentation

### Adding Diagrams

1. Create diagram using tools like:
   - [Excalidraw](https://excalidraw.com/) (free, open-source)
   - [Draw.io](https://app.diagrams.net/) (free)
   - [Mermaid](https://mermaid.js.org/) (code-based, can be embedded in Markdown)
   - Figma, Lucidchart (if you have access)

2. Export as PNG (recommended) or SVG
3. Place in `docs/diagrams/` with descriptive name
4. Update this README with:
   - File name and description
   - What components/flows it shows
   - Where it's referenced in main docs

### Adding Screenshots

1. Take screenshot of feature/UI
2. Crop to focus on relevant area
3. Resize if needed (max 2000px width)
4. Save as PNG in `docs/screenshots/`
5. Update this README with:
   - File name and description
   - Features/components visible
   - Context for when this screen appears

---

## 🔗 Related Documentation

- [Main README](../README.md) - Project overview, setup, features
- [Lessons Learned](./LESSONS_LEARNED.md) - Technical challenges and solutions
- [Infrastructure README](../infra/README.md) - Terraform setup guide

---

## 🤝 Contributing to Documentation

### Documentation Standards

1. **Clarity:** Write for developers unfamiliar with the project
2. **Completeness:** Include all necessary context and prerequisites
3. **Currency:** Update docs when features change
4. **Visual Aids:** Use diagrams/screenshots to illustrate complex concepts
5. **Examples:** Provide code snippets where applicable

### Documentation Checklist

When adding a new feature:
- [ ] Update main README with feature description
- [ ] Add architecture diagram if introducing new components
- [ ] Add screenshots showing UI changes
- [ ] Update API reference if new endpoints added
- [ ] Update LESSONS_LEARNED.md with technical challenges
- [ ] Update this file with new diagram/screenshot entries

---

## 📝 Maintenance

### Regular Updates Needed

- **Screenshots:** When UI/UX changes
- **Architecture diagrams:** When adding/removing services or major refactoring
- **Flow diagrams:** When interview process changes

### Document Review Schedule

- **After each major feature:** Review and update relevant docs
- **Before releases:** Ensure all docs reflect current state
- **Quarterly:** Review for outdated information or broken links
