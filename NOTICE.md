# Attribution

## Proctoring platform

The examination and proctoring layer of this project — user/exam management,
the Flask application shell, and the webcam-based proctoring pipeline
(`camera.py`, `face_detector.py`, `face_landmarks.py`, `verify_face.py`,
and the associated templates) — is derived from **MyProctor.ai**:

> **MyProctor.ai — AI-Based Smart Online Examination Proctoring System**
> Narender Kumar (`narender-rk10`)
> https://github.com/narender-rk10/MyProctor.ai-AI-BASED-SMART-ONLINE-EXAMINATION-PROCTORING-SYSYTEM

That upstream project does not carry an explicit licence. It is used here for
academic and research purposes. If you intend to reuse or redistribute this
repository, contact the upstream author regarding permissions.

## Career-Copilot additions

The following were written for this project and are not part of the upstream:

| Component | Files |
|---|---|
| AI Interviewer (Gemini-driven, adaptive follow-ups) | `ai_interviewer.py`, `ai_routes.py`, `test_ai_interviewer.py` |
| ATS Score Checker | `ats-scorer/`, `templates/ats_calculator.html` |
| Résumé Creator | `Resume Creator/`, `templates/resume_builder.html` |
| Coding evaluation | `code_executor.py` |
| AI Interview Preparer (Next.js, Azure OpenAI + Azure Speech) | `interview-preparer/` |

`interview-preparer/` is a separate Next.js application (MIT licensed, see
`interview-preparer/LICENSE`) implementing the interview-preparation module.
It was previously a standalone repository and has been folded in here, since
it is a component of this platform rather than a project in its own right.

These are the components described in the accompanying paper,
*Career-Copilot: An AI-Powered Recruitment and Career Preparation Platform*.

## Gaze tracking

`gaze_tracking_repo/` is a git submodule pointing at **GazeTracking** by
Antoine Lamé (MIT licensed):

> https://github.com/antoinelame/GazeTracking

Initialise it with `git submodule update --init --recursive`.

## Model weights

`models/yolov3.weights` (~236 MB) is not committed. Fetch it with
`python download_yolo_weights.py`. The other files in `models/` are OpenCV's
pre-trained face detection models, distributed under Apache 2.0.
