# nextjs-packages
Collection of self-authored NEXTJS-intended convenience and management tools.


Run tests:

`pnpm test`

`pnpm --filter nextjs-settings test`

Build packages:

1. Echo github token for packages auth
   
```bash
export GITHUB_TOKEN=ghp_ABC123xyz
```

2. Build packages
```bash
cd packages/nextjs-logging
pnpm publish --access=public

cd ../nextjs-settings
pnpm publish --access=public
```

