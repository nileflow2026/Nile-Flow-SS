# WEEK 1 FOUNDATION STABILIZATION SPRINT — TODO LIST

## Task 1 — Route Validation & Page Integrity Audit
- [x] Read AGENTS.md and NILE_FLOW_WEBSITE_REVAMP_REPORT.md
- [x] Read App.jsx — identify all 40+ route imports
- [x] Read package.json — identify all dependencies
- [x] Read main.jsx, vite.config.js, tailwind.config.js, index.css
- [ ] Read existing page files to understand patterns
- [ ] Generate ROUTE_AUDIT_REPORT.md with all route findings
- [ ] Create all 18 missing placeholder pages

## Task 2 — Dependency Audit
- [ ] Analyze every dependency in package.json for actual usage
- [ ] Generate USED_DEPENDENCIES.md
- [ ] Generate UNUSED_DEPENDENCIES.md

## Task 3 — Remove Dead Dependencies
- [ ] Remove server-only deps: ioredis, web-push, crypto
- [ ] Remove tooling deps: npm, install
- [ ] Remove unused icon libs: @fortawesome/*, react-icons
- [ ] Remove unused carousel: react-slick, slick-carousel
- [ ] Remove react-parallax
- [ ] Remove framer-motion (assess usage first)
- [ ] Remove unused CSS imports from main.jsx
- [ ] Run build validation after removals
- [ ] Generate DEPENDENCY_CLEANUP_REPORT.md

## Task 4 — Icon System Standardization
- [ ] Audit all icon imports across Website/
- [ ] Replace FontAwesome icons with Lucide equivalents
- [ ] Replace React Icons usage with Lucide equivalents
- [ ] Generate ICON_MIGRATION_REPORT.md

## Task 5 — Duplicate Context Detection
- [ ] Audit CartContext in components/ vs Context/
- [ ] Audit AuthContext in Context/ vs CustomerAuthContext
- [ ] Check all imports for context usage
- [ ] Remove duplicate implementations
- [ ] Generate CONTEXT_AUDIT_REPORT.md

## Task 6 — Dead Asset Analysis
- [ ] Audit constants/ files
- [ ] Audit src/assets/ files
- [ ] Determine which assets are used vs unused
- [ ] Remove proven unused assets
- [ ] Generate ASSET_CLEANUP_REPORT.md

## Task 7 — File Structure Normalization
- [ ] Fix "HeroCarousel .jsx" space in filename
- [ ] Check for other space/inconsistency issues
- [ ] Update all imports referencing changed files
- [ ] Generate FILE_STRUCTURE_REPORT.md

## Task 8 — Production Log Cleanup
- [ ] Search for console.log, console.warn, console.debug across Website/
- [ ] Classify each as SAFE TO REMOVE or KEEP
- [ ] Remove production debugging statements
- [ ] Generate LOG_CLEANUP_REPORT.md

## Task 9 — Build Verification
- [ ] Run npm install
- [ ] Run npm run build
- [ ] Verify zero build failures
- [ ] Fix any build issues
- [ ] Generate BUILD_VALIDATION_REPORT.md

## Task 10 — Week 1 Execution Summary
- [ ] Compile all findings into WEEK1_FOUNDATION_SPRINT_REPORT.md
- [ ] Include: Files modified, deleted, deps removed, routes fixed, etc.
