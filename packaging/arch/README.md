# Arch Linux packaging

The AUR package is named **`inkwell-editor`** because the plain `inkwell` name is
already provided by an unrelated package (`inkwell-bin`).

> **AUR publication is on hold.** AUR account registration is currently
> closed. Build locally with `makepkg -si`; the publish steps below are for
> when registration reopens.

## Build and install locally

```bash
cd packaging/arch
makepkg -si
```

The PKGBUILD builds the tagged release from source: it installs the frontend
dependencies with pnpm, builds `dist/`, compiles the Rust binary, and installs
the binary, desktop entry, icons, and license.

## Publish to the AUR

After the `v0.2.0` tag exists on GitHub:

```bash
cd packaging/arch
makepkg --printsrcinfo > .SRCINFO
git clone ssh://aur@aur.archlinux.org/inkwell-editor.git /tmp/aur-inkwell-editor
cp PKGBUILD .SRCINFO /tmp/aur-inkwell-editor/
cd /tmp/aur-inkwell-editor
git add PKGBUILD .SRCINFO
git commit -m "Initial upload: 0.2.0-1"
git push
```

Update `pkgver`, `pkgrel`, and regenerate `.SRCINFO` for each release.
