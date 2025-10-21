# Logo Placeholder

## About

This directory should contain your app logo file named `LOGO.jpg`.

## Requirements

- **Filename**: `LOGO.jpg` (or update references in `index.html`)
- **Format**: JPEG, PNG, or WebP
- **Recommended size**: 512x512 pixels or larger
- **Aspect ratio**: 1:1 (square)

## Usage

The logo is used in the following places:

1. Browser favicon (`index.html` - line 10)
2. PWA manifest icon
3. Fallback cover image (`src/utils/helpers.ts`)

## Adding Your Logo

1. Create or obtain a square logo image
2. Save it as `LOGO.jpg` in this directory (`public/LOGO.jpg`)
3. Alternatively, update the references in:
   - `index.html` (favicon link)
   - `src/utils/helpers.ts` (FALLBACK_COVER constant)

## Temporary Solution

If you don't have a logo yet, you can:

- Use a placeholder from [placeholder.com](https://via.placeholder.com/512)
- Download a free icon from [Flaticon](https://www.flaticon.com/)
- Create one using [Canva](https://www.canva.com/)
- Use the default music note emoji as a text-based logo

## Note

The current implementation references `LOGO.jpg`. If you use a different filename or format, make sure to update all references throughout the codebase.