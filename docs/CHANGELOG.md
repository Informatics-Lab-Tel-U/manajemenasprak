# [1.8.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.7.0...v1.8.0) (2026-07-21)


### Features

* **presensi:** enhance generator logic, UI, and add theme presets ([c208e29](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c208e293dfc4a5e95052af1e3ea6fe57d8d09b06))

# [1.7.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.6.0...v1.7.0) (2026-07-20)


### Bug Fixes

* **generator:** fix kode asprak formula in rekap sheet and add generators ([742b955](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/742b9556bf9a7be52ebb661ffe4f7c74b1af14a2))
* **presensi:** fix rekap kode asprak, merge evidence column, and apply color constants ([0a08446](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/0a084467499a3036f7b869993f83cf2ec21b8793))
* **ui:** make date picker label more descriptive for Modul 1 ([4fd883d](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/4fd883d700e09e31651122fca65097db9f64731a))


### Features

* **presensi:** shift LIST ASPRAK table and apply header color ([d4c55f1](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d4c55f136042cfb1bc7d6dbeec6405457aeb330c))
* **presensi:** shift LIST ASPRAK table to B2 and use white background for data ([b9ae39e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b9ae39e7571a41bb1bdfa3c3060ed6a0b501e774))

# [1.6.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.5.0...v1.6.0) (2026-07-20)


### Features

* display package version on login page and adjust title alignment ([ede9b44](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/ede9b44b955cbc77215ab0d86217a74f91fb2bfd))

# [1.5.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.4.0...v1.5.0) (2026-07-20)


### Bug Fixes

* consistent spinner structure for export dialog ([609ec3e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/609ec3e018292b3fba74a437fbfe2a96c05f3dfa))
* **onboard:** optimize API queries, Zustand localstorage quota, and update page title ([9b9a113](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/9b9a11375ce2ddbfebd548484ad6b8cb360714e0))
* **praktikan:** fix cache staleness and react-doctor warnings ([bc0ab86](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/bc0ab868be6b53a845cb1509b43d006576ce9c59))
* re-add TooltipProvider and shadcn preset updates ([7cfb21a](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/7cfb21ab82fd7e500526d1fa6c98d8645973ce0d))
* resolve 36 react-doctor issues for 100/100 score ([d648cf9](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d648cf9aee22ef865672a29e922ad01d5f5aab5e))
* resolve cache key bug in getCachedKelas to ensure independent caching per mata kuliah ([8dea669](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/8dea66956420fee0c01e8abe2093de8d6393e31a))
* resolve UI freezing on onboard navigation with loading skeletons ([86fb953](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/86fb95352da5f5d5c4c3fb8db9e4b48732345db2))
* **security:** Fix IDOR in pelanggaran, fix SSR cookie bug, and implement atomic copy RPC ([208ab77](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/208ab77e7dd6284d1b621708a1beb789f05dc5eb))
* sync pnpm-lock.yaml with package.json ([9aa4c0e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/9aa4c0e6e485da43731d0d65a54d9853ef35911a))


### Features

* add presensi generator feature and fix freeze panes bug ([88d8741](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/88d87417630fb6ca0671cd1a709f45d40293db43))
* add YA/TIDAK input type and support shadcn Select for total nilai weighting ([81b6905](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/81b69055de163bb58a423bd8bb5a1b32e0797843))
* customizable formula weights for total nilai in presensi excel ([e678e69](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/e678e69b9ab255f4a1bb280753b5015476e2c806))
* customizable praktikan and asprak rows for excel generator ([ca384ee](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/ca384ee92ba6aecb6b08d4e6ad0d70deb806ea0a))
* implement global term selector, fix react-doctor warnings, and resolve calendar overlap UI ([b5a11aa](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b5a11aa0df07461290577c3115c18345b1772048))
* **observability:** refactor logger to JSON and fix TS errors ([fb0c617](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/fb0c61790642f93a4bb87e0f0291b469c59feebf))
* **praktikan:** bulk delete, export modal, import perf fix & loader spinner ([b6c1bf6](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b6c1bf61ef91f36ae46e07d040c210bb9fb37f6d))
* redesign success step UI to be more modern and premium ([e66f75e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/e66f75eca67a19923da2aa5c0d201dafb5fdba56))
* restructure onboarding flow to central hub ([60b41e0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/60b41e01b5731d23277c688fe430aff77b3d5325))
* sync Jadwal Pengganti features with Data Praktikan and fix react-doctor warnings ([10b1095](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/10b1095a1cfc3dad35493a14eec112e988845e45))


### Performance Improvements

* optimize API endpoints with unstable_cache and fix Next.js 16 types ([88aa149](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/88aa149f2b17eac4c52e08b2e3a52ea2fa2a0f88))
* refactor sequential loop to Promise.all in praktikanService ([619727c](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/619727c315fc995d598be49af8b9b27472f930a9))

# [1.4.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.3.0...v1.4.0) (2026-06-20)


### Bug Fixes

* overview jadwal ([d8ff547](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d8ff5474711e7e93a6131c76daafb9e6f0c6d7cf))


### Features

* adding new api for kursi gen ([9fb7cb8](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/9fb7cb88001a6c8619c0acd10e043ab3f2221224))

# [1.3.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.2.2...v1.3.0) (2026-06-01)


### Features

* add new praktikan service ([dd8e09c](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/dd8e09c14f14538c65dac608582a9714f17207af))
* add praktikan management page (ui) ([8463d18](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/8463d18ec69250ec876e9a122c877b44781d13b3))
* add sql function and apikey protected endpoint ([3046f0a](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/3046f0ad7adc11482bc8c28c68c4d16bb3f8cb83))

## [1.2.2](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.2.1...v1.2.2) (2026-05-02)


### Bug Fixes

* fix selected data on edit modal ([25483e1](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/25483e1e9203ea6bea37826b00362577ed098d5c))

## [1.2.1](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.2.0...v1.2.1) (2026-04-13)


### Bug Fixes

* fix guard schedule by module ([754ae2a](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/754ae2a950f3e963ac76cce8d3c3f4c4da87ca1f))
* jadwal jaga tampil dan input ([0c2f35f](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/0c2f35fd5a27321b7e66ebbe1b651b94780b2269))

# [1.2.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.1.0...v1.2.0) (2026-04-05)


### Bug Fixes

* toaster not showed up ([b01c21b](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b01c21bcdfc19ddcf9144fb2d3e41d0be7fb227c))


### Features

* sort by column on jadwal pengganti page ([a5a15d5](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/a5a15d5d1dd7a340ca68979a5dae4994cbd6b3bf))

# [1.1.0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/compare/v1.0.0...v1.1.0) (2026-04-05)


### Features

* replace mata kuliah with praktikum dropdown in jadwal pengganti modal and add smart kelas sorting in jadwal pengganti modal ([be142ba](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/be142ba364f163a6af5a70f5be90ff0c8b562aae))

# 1.0.0 (2026-03-16)


### Bug Fixes

* add pelanggaran modal ([b685365](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b6853651de4c236219d14d42d51e4cf6bbece906))
* adding POST method to login form ([43ced1c](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/43ced1caba8ce7c4dedb4d834ddded730b0fbab9))
* better ordered asprak entries and schedule session consistency on overview page ([8aac941](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/8aac94197ca68910ca898db05678b9e9bb0f79f4))
* button component usage on jadwal page ([03dd2bd](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/03dd2bd8e231f9bc2de30f96a0f05eb62483eb66))
* button component usage on jadwal page ([e629cf9](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/e629cf96c250d8c267d8794c3bd391afce1f716a))
* expand module limit to 15 and cleanup import conflict logic ([c637f16](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c637f160a44e7c6d195334913f89b78f0d77cf6d))
* export pelanggaran column struct ([17f27a8](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/17f27a8f3d8bf0b9ecacf5f54eeabdfbb99ac90e))
* formatting ([80a76bc](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/80a76bc7c1eae8ded0254da412a0f6ab68410e5c))
* implement RBAC, audit log, manajemen akun, dan refactor service + API layer ([fe84c19](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/fe84c19a4cb214c225a380ac4662afbe27d64f39))
* manajemen account, data praktikum and pelanggaran page ([b9e656f](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b9e656f40d61349bf98b63c7510bde85d94117c2))
* manajemen akun and pelanggaran service ([0effc57](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/0effc579e3346379d978dddb588f076b96a55c9c))
* middleware for auth ([04c1898](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/04c189888e215636dc805de3dd00e94837f7c1d6))
* overview statistic ([6c16f1d](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/6c16f1da58e97efe89b257daf80aec68f6e14fd0))
* **pelanggaran:** better UI and override default schedule with replacement schedule on the add modal ([2033e48](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/2033e48ccc895d5fe5fd190fa74313414ef438cf))
* redudant code ([6902ae6](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/6902ae6dcf2979583c7ab6a082d2df60955da8fb))
* redudant code the sec ([ebb4bff](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/ebb4bffda9dabca0c56e8991295fec6b39c8b075))
* schedule color consistency ([c83b1e9](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c83b1e9dfed5a9e5f4a5bb79966ba55ca7a46faf))
* **security:** role on modul-schedule route ([604076a](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/604076aab96b6d16b46c7c4b252af2baaee553ad))
* Show original CSV row numbers in preview ([c8dfa69](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c8dfa69d0a72cba67168281ab4a8bbc84bf07242))
* **ui:** Display ASLAB term, fix kode import and UI ([6135bb0](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/6135bb055f16371f5af1e2658bb05289fff6597c))
* **ui:** resolve hydration error in sidebar navigation ([cc959d5](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/cc959d510d8a68ff02a1bbe0942755eca04e2260))
* validation bug on import asprak by csv ([f791fd9](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/f791fd99203197a77bbe6d109ee666c9de5ad158))
* validation bug on import asprak by csv ([bf1076d](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/bf1076dae21dd662becdedca6f33f236024acbe9))
* validation bug when import asprak by csv ([2e57c49](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/2e57c49f415333998c3b36626345337eb5ccf9f8))


### Features

* add explicit schedule visualisation for reguler and pjj class ([2413ccc](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/2413ccc6892b82a6fb8d5e8d6ad9f263c7aea486))
* add functionalitiy to modul dropdown, change schedule, and more ([92c8ae6](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/92c8ae63c2e3496ad1ece13ab3e89fde2282a5fd))
* Add modul schedule feature and UI updates ([b19fb16](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b19fb164fd9571b002ef1cf6321efd742b0c4c5a))
* add progress bar to database import excel ([b72187d](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b72187d4692c4b1e2229f3172b947368ff4506b9))
* adding import from CSV for jadwal praktikum and panduan page ([c113bc7](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c113bc7f758f8c3c9b1054bf4803ac87bc3a5936))
* adding middleware ([50a3db4](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/50a3db4c9d4eae6a3b14481a209279fa82e255ef))
* adding middleware ([43e0aea](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/43e0aead4c404e50182d2079222a4a8e1477d25e))
* adding schedule on overview page and remove redudant contents ([86fc9b3](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/86fc9b3daf1ca9adcd9231e29d5a1b8f61edcee2))
* adding term selector on dashboard page ([53db757](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/53db7573b9c73280bfebc28d2b30bfa2d3770226))
* **admin-dashboard:** implement RBAC, audit log, manajemen akun, dan refactor service + API layer ([a4eee2d](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/a4eee2d3dc7d077cb1aa1070800a36a29fa0b337))
* **admin-dashboard:** implement RBAC, audit log, manajemen akun, dan refactor service + API layer ([d217365](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d217365fa9ba22a43e2f59ab3c308fa9394a2101))
* **asprak-import:** add checkbox selection to csv preview ([cebfe85](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/cebfe85be67335b57cf87707f1a0ff3435c32db2))
* **asprak:** add role support to CSV import flow and validation ([b935496](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b935496bed140839fb1e7e369ce05262e8d61221))
* **asprak:** enhance code generation rules and interactive preview ([f4c3f72](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/f4c3f72b77119a83b72d94002ad37581b804f423))
* **asprak:** enhance manual input with multi-term support and strict validation ([6dbe8dd](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/6dbe8ddbe218020f79938a2da245c603777314f9))
* better jadwal color picker ([7f71de1](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/7f71de16fd162d463c1a94a1fe95fff12e947efd))
* color picker for praktikum schedules ([590b075](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/590b075b284dc0ab148d9ca80827e2dd59ce9d2a))
* enhance asprak csv import system ([02e35a8](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/02e35a87d68095061ab5796d7f09b6d90e0ec1f9))
* enhance praktikum management and fix asprak assignment editing ([b477a16](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/b477a16425bef0a832af1d041866e80cf5c3d8c9))
* implement asprak assignment editing, delete dialog, and update generation rules 2.1/2.2 ([7d3c250](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/7d3c250b01f00174d0865dc28142056cbd1c9a7e))
* implement code generation rule visualization and enhanced navigation ([a73651a](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/a73651a4a7532af5c24f01d56337201053d962e2))
* implement shadcn/ui design system with blue theme ([7747eeb](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/7747eebc3fa100f23d91ea5dc0e822c40cad8457))
* **import:** add Excel import wizard and enhanced asprak validation ([2f45644](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/2f456448d85cb344545635fe17c82a36290c222c))
* improve asprak management UX and schedule display ([4ede465](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/4ede465f769d8bb3f1e76f6aec6f3347494680ac))
* jadwal pengganti page ([d821168](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d821168e9b78a599d201397a8ffcca9d651f446e))
* **jadwal:** redesign schedule interface to matrix layout ([33665a9](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/33665a9ffe67814f37d411c7cefcb52123f31dbd))
* maintenance mode ([0e67502](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/0e675028302f0daff95f11718066aaa9feeb2954))
* **mata-kuliah:** enhance import logic, manual input UX, and card design ([50abf2e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/50abf2e99b6a6a632a6a072a98f15edb4ed1ee42))
* modul dropdown and reschadule button ([e5f3c51](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/e5f3c51240704ad267ec39a0391d153dc843d23f))
* page for logs, account management and login ([31e21c8](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/31e21c8902b06f7c3f86ddaf585acf76ee6db2c5))
* pelanggaran and accoutn swicther button ([87f2fa1](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/87f2fa1fe9df269ee4f251e24314cb630ec4f876))
* pelanggaran functional and better account management ([6308557](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/630855724d25379faa79e1b7b7b1e9c37dae54bd))
* pelanggaran page and asprak koor categories on modal ([8a93758](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/8a937581c3ccfff75f0f39b2bf709a39d54a0da9))
* **plotting:** create plotting page, enhance import UI, add template download ([0c0955b](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/0c0955b3eb2174a0d524ed8910ed8f062b651df7))
* reset finalized pelanggaran ([2ac37fc](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/2ac37fc032701f80509ae095d7ff307b93c76ae9))
* responsive UI on login page ([c761e92](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c761e922af3b3cd8e534151c8243db625bae72cf))
* **schedule:** support PJJ, custom jam (sesi=0), and multi-schedule cells ([c9f89d6](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/c9f89d67567e9812c24ad9c457f95780daf4e62d))
* schme changes and authentication integration ([4a49de8](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/4a49de8c4b3d3c0b97a3bcaa9aa89d8e3c623a89))
* **ui:** update sidebar and enhance praktikum details ([d484eaf](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/d484eaf8080fd038d7c61b8f5063d316b4abae44))
* Validate sequential module dates and Monday rule ([aa9259e](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/aa9259e1067a17e2cb2285d72e3856b137d6ea94))


### Performance Improvements

* memomizing datatabke on panduan page ([3340c23](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/3340c23a6625ca821baf916499ae1f0f0c374f40))
* optimizing sekelton usage and use promie.all for paralel load ([4c8a497](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/4c8a497525c111ac0d909839bbeb6b10d32c8708))
* use chaching for optimal data load ([f974757](https://github.com/Informatics-Lab-Tel-U/manajemenasprak/commit/f97475785e622460131fdd50b474be197a840fc3))


### BREAKING CHANGES

* Complete UI overhaul

# Changelog

**Format**: Semantic Versioning (MAJOR.MINOR.PATCH)  
**Last Updated**: March 16, 2026

---

## v1.0.0

### Added or Changed

**Core Features**:

- Asprak Management: Full CRUD operations with automatic code generation (JD2024001 format), bulk import/export, NIM validation, and cohort tracking
- Schedule Management: Weekly practicum scheduling with course-to-room mapping, module-based scheduling, multi-term support, and replacement schedule handling
- Assignment System (Plotting): Dynamic asprak-to-course assignment with bulk import, real-time conflict detection, and validation system
- Violation Tracking: Disciplinary record keeping with four violation types (Tidak Hadir, Terlambat, Tidak Lengkap, Lainnya), module-specific recording, and immutable finalized records
- Role-Based Access Control (RBAC): Three roles (Admin, Aslab, Asprak Coordinator) with row-level security policies and permission-based UI rendering
- Audit Logging: Complete audit trail with automatic logging of all data changes, user identification, timestamps, and audit log viewer
- Dashboard & Analytics: Key statistics, violation summaries, schedule overview, and system health indicators

**Technical Stack**:

- TypeScript end-to-end type safety
- Next.js 16.1 with React Server Components
- Supabase PostgreSQL database
- Shadcn UI component library with Tailwind CSS 4.x
- TanStack Table for data grids and Recharts for data visualization
- JWT-based authentication with HTTPS/SSL encryption
- Automatic backups and database management

**Infrastructure & Documentation**:

- Development environment setup with npm scripts for development, building, linting, and formatting
- Production-ready configuration with Docker, Vercel, PM2, and Nginx support
- Complete API reference, architecture documentation, database schema with ERD, development guide, deployment guide, security documentation, troubleshooting guide, and service layer documentation
- Sample data (seed script), connection testing utility, and manual test procedures

**Security Implementation**:

- Strict input validation on all endpoints with SQL injection prevention through parameterized queries
- CSRF protection via Next.js built-in mechanisms
- JWT token validation on every request
- Environment variable separation with .env.local for secrets
- Security headers configured (X-Frame-Options, X-Content-Type-Options, etc)
- HTTPS/TLS encryption required

### Known Limitations

- Single-region deployment (Supabase)
- Maintenance window requires manual trigger
- Password reset requires email verification (Supabase limitation)

---

## Version History

| Version | Release Date | Status   | Description                                                             |
| ------- | ------------ | -------- | ----------------------------------------------------------------------- |
| 1.0.0   | 2026-03-16   | Released | First production-ready version with core features, RBAC, and audit logs |

---

## Support

- Bug Reports: [GitHub Issues](https://github.com/your-org/manajemen-asprak/issues)
- Feature Requests: [GitHub Discussions](https://github.com/your-org/manajemen-asprak/discussions)
- Security Issues: security@lab.id
- General Questions: Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated**: March 16, 2026  
**Maintained By**: Development Team  
**Next Review**: June 16, 2026
