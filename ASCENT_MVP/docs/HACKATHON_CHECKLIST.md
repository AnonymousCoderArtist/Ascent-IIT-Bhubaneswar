# ASCENT — Final Submission Checklist

## Product

- [ ] Signup/login works
- [ ] User onboarding works
- [ ] Character is visible
- [ ] World is visible
- [ ] Quest CRUD works
- [ ] Quest completion grants server-calculated rewards
- [ ] XP is non-linear
- [ ] Level changes correctly
- [ ] Rank changes correctly
- [ ] Streak works
- [ ] Five attributes work
- [ ] Essence works
- [ ] Inventory/store data works
- [ ] World/character evolution is visible
- [ ] AI quest recommendation works OR deterministic fallback is polished

## Security/data

- [ ] RLS enabled
- [ ] Cross-user access tested
- [ ] No client-authoritative XP/Essence
- [ ] Duplicate completion prevented
- [ ] Refresh persistence verified
- [ ] No localStorage-only primary data

## UX

- [ ] Mobile layout
- [ ] Desktop layout
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Screen-reader labels
- [ ] Reduced-motion mode
- [ ] Friendly error states
- [ ] Loading/skeleton states
- [ ] No blank screens

## Release

- [ ] Public GitHub repo
- [ ] At least 3 chronological commits
- [ ] Backend code included
- [ ] `.env.example` included
- [ ] Live URL tested from a clean/incognito browser
- [ ] Video 90–180 seconds
- [ ] Video under 100MB
- [ ] Video proves signup/login → task → level-up → refresh persistence
- [ ] No secrets visible in repo/video
