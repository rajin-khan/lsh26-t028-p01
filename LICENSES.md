# Third-party licences

KajChole contains no copied template, UI kit, stock image, external icon set, chart library, analytics SDK, database SDK, or redistributed font file. The interface, timeline, mark, scheduler, and visual system are original event-work code. CSS uses locally available system font families and does not redistribute font files.

## Runtime dependencies

| Material | Version | Licence | Use |
| --- | --- | --- | --- |
| Next.js | 16.2.11 | MIT | Application framework and production build |
| React | 19.2.4 | MIT | Interface runtime |
| React DOM | 19.2.4 | MIT | Browser rendering |

## Development dependencies and tools

| Material | Version | Licence | Use |
| --- | --- | --- | --- |
| TypeScript | 5.8.3 | Apache-2.0 | Strict type checking |
| @types/node | 22.15.30 | MIT | Node.js type declarations |
| @types/react | 19.1.8 | MIT | React type declarations |
| @types/react-dom | 19.1.6 | MIT | React DOM type declarations |
| pnpm | 10.28.2 | MIT | Package manager; packages were copied from the existing sibling workspace with zero downloads |

## Event and reference material

`EVENT.md`, the P01 requirements, scoring rules, start code, and manifest fields come from LofiStack Hackathon 2026 participant material.

CurrentJabe was reviewed as pre-event reference material for Bangladesh outage language, overnight time handling, bilingual copy, and accessible form patterns. GridGenius was reviewed for Bangladesh energy-planning context and time-based information presentation. KajChole does not include their data, database, models, APIs, brands, maps, images, fonts, or source modules.

## AI assistance

OpenAI Codex assisted with requirement comparison, domain modeling, implementation, interface design, tests, documentation, and browser QA under the team lead's direction. AI use is disclosed in `evaluation-manifest.json`; the team verifies the result with deterministic tests, TypeScript, a production build, and browser checks.
