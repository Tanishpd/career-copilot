# Dependency upgrade — what changed and what to check

All 556 Dependabot advisories were resolved by upgrading `requirements.txt`
(458 alerts) and `interview-preparer/` (98 alerts). This note records what was
verified statically and what still needs a run.

## Python — the big one

**402 of the 556 alerts came from a single pin: `tensorflow==2.2.0` (2020).**

The upgrade target is **TensorFlow 2.15.1**, not the latest. Reasoning:

- The highest patch level required across all 402 tensorflow advisories was
  **2.12.1** — anything at or above that clears every one of them.
- `camera.py` builds a YOLOv3 model with the Keras functional API
  (`tensorflow.keras.Model`, `Lambda`, `l2`). **TF 2.16+ defaults to Keras 3**,
  which breaks that style of code.
- 2.15.1 is the last Keras-2 release. It sits above the required patch level
  and below the Keras 3 switch.

Going to 2.20 would have bought zero additional security and risked the
proctoring pipeline.

### Runtime requirement

TF 2.15 publishes no wheels for Python 3.12+. **Use Python 3.9–3.11:**

```bash
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

## What was checked and found clean

Scanned the codebase for every API removed between the old and new pins:

| Removed API | Used here? |
|---|---|
| `flask.Markup`, `flask.escape` | no |
| `@before_first_request` (gone in Flask 2.3) | no |
| `flask.json.JSONEncoder` (gone in 2.3) | no |
| `werkzeug.security.safe_str_cmp` | no |
| `werkzeug.urls.url_encode` / `url_quote` | no |
| `np.float` / `np.int` / `np.bool` (gone in numpy 1.24) | no |
| TF1-style `tf.Session` / `tf.placeholder` / `tf.contrib` | no |

So the Flask 1 → 3 jump, which is normally the risky part, touches nothing in
this codebase. `@app.before_request` (app.py:103) is still supported.

## What still needs a run to confirm

1. **`Flask-MySQLdb` 0.2.0 → 2.0.0.** Major version jump. The usage here
   (`from flask_mysqldb import MySQL; mysql = MySQL(app)`, app.py:8/92) matches
   the current API, and `MYSQL_*` config keys are unchanged — but exercise a
   DB-backed route.

2. **`deepface` 0.0.49 → 0.0.93.** Three call sites, all on the stable surface:
   - `DeepFace.verify(img1_path=…, img2_path=…, enforce_detection=False)` — app.py:531, verify_face.py:9
   - `DeepFace.build_model('VGG-Face')` — download_model.py:7
   Both signatures still exist. Model weights may re-download on first run.

3. **`dlib` is now declared.** It was imported by `face_landmarks.py` but missing
   from `requirements.txt` entirely — the install was broken for anyone starting
   fresh. It needs CMake and a C++ toolchain to build.

## Removed

- `object_detection==0.0.3` — not imported anywhere; abandoned PyPI package.
- `matplotlib==3.3.3` — not imported anywhere.

## interview-preparer (Node)

- `next` 16.0.10 → 16.2.11 (62 alerts)
- Transitive fixes pinned via `pnpm.overrides`: `postcss >=8.5.12`,
  `sharp >=0.35.0`, `find-my-way >=9.7.0`
- `eslint` held at `^9` and `typescript` at `^5` — `--latest` had pushed them to
  10.x/7.x, breaking peer ranges for `eslint-plugin-import` and `next`.

`pnpm audit` reports **0 vulnerabilities**, 0 unmet peers.

Run `pnpm install && pnpm prisma generate` before building — the generated
Prisma client is no longer committed.
