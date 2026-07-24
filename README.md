
Career-Copilot: AI-Powered Career & Hiring Platform

Developing an AI-driven unified platform that streamlines the hiring journey for job seekers and employers, while complementing platforms like LinkedIn. Career-Copilot helps candidates improve LinkedIn-driven applications by optimizing resumes, preparing for interviews, and boosting ATS compatibility—while enabling recruiters to automate screening and interviews at scale.

🔹 Key Features:

AI Resume Creator – Creates ATS-friendly resumes with templates, bullet-point recommendations & PDF export.

ATS Score Checker – Uses NLP (SpaCy, Sentence-BERT embeddings, keyword & semantic matching) to parse resumes, match skills with JDs, detect formatting issues & generate ATS score with suggestions.

AI Interview Preparer – Provides coaching with JD-based Qs, speech practice, coding evaluation, real-time feedback & scoring metrics.

AI Interviewer – Automates interviews with a virtual avatar using real-time STT, TTS, follow-up Q generation, attention analysis & video-based evaluation.

🔹 Tech Stack & Tools:

Programming: Python, JavaScript, HTML, CSS, Flask

Database: MySQL

AI/NLP: SpaCy, Sentence-BERT, NER, Semantic Search, Keyword Matching

ML/LLM: Large Language Models for Q&A & evaluation

Speech/Video: STT, TTS, real-time streaming, interview avatar

Resume Tools: Parsing, Scoring, Grammar/Spell Check, ATS checks

Version Control & Deployment: Git/GitHub, Google Drive, deployment-ready backend

🔹 Impact:

Strengthens LinkedIn-to-application process by improving resume visibility, ATS fit & candidate readiness.

Raises shortlisting chances for job seekers.

Saves recruiters’ time with scalable, automated & bias-free hiring workflows.

Demonstrates expertise in Full-Stack Development, AI/ML, NLP, Real-Time Systems & Recruitment Tech.

## Licensing and attribution

This repository has mixed provenance. The proctoring layer is derived from
[MyProctor.ai](https://github.com/narender-rk10/MyProctor.ai-AI-BASED-SMART-ONLINE-EXAMINATION-PROCTORING-SYSYTEM)
by Narender Kumar, which carries no licence — so no rights to those portions
are granted here. The components written for this project are MIT licensed.

See [LICENSE](LICENSE) for the split and [NOTICE.md](NOTICE.md) for the
file-by-file breakdown.

## Configuration

All credentials are read from the environment. Copy `.env.example` to `.env`
and fill it in — never commit `.env`.

```bash
cp .env.example .env
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Requires Python 3.10–3.11; see the header of `requirements.txt` for why.
