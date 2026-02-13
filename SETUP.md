# 🛠️ Setup Guide

This guide will help you get Pecunia up and running in your Google Sheets.

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)
- A Google account

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@google/clasp` - Google Apps Script CLI
- `jest` - Testing framework
- `eslint` - Code linter
- Type definitions for Apps Script

### 2. Authenticate with Google

```bash
npx clasp login
```

This will:
1. Open your browser
2. Ask you to sign in to Google
3. Request permission to manage Apps Script projects
4. Save credentials to `~/.clasprc.json`

### 3. Create or Link Apps Script Project

#### Option A: Create New Project

```bash
npx clasp create --type sheets --title "Pecunia"
```

This creates:
- A new Google Sheets file
- An Apps Script project attached to it
- A `.clasp.json` file with your project ID

#### Option B: Link to Existing Spreadsheet

1. Open your Google Spreadsheet
2. Go to **Extensions > Apps Script**
3. Copy the Script ID from the URL (it's the long string after `/projects/`)
4. Create a `.clasp.json` file in your project root:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
```

### 4. Push Code to Apps Script

```bash
npm run push
```

This uploads `src/Code.js` and `src/appsscript.json` to your Apps Script project.

### 5. Open Your Script

```bash
npm run open
```

This opens the Apps Script editor in your browser where you can:
- View the deployed code
- Test functions manually
- View execution logs

### 6. Test in Google Sheets

1. Open your Google Spreadsheet
2. In any cell, type: `=PECUNIA("NASDAQ:GOOGL", "price", GOOGLEFINANCE("NASDAQ:GOOGL", "price"))`
3. Press Enter
4. The function should return the current Google stock price

## Development Workflow

### Making Changes

1. Edit `src/Code.js` locally
2. Run tests: `npm test`
3. Fix any linting issues: `npm run lint:fix`
4. Push to Apps Script: `npm run push`
5. Test in Google Sheets

### Testing Locally

Run tests without deploying:

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Pulling Changes from Apps Script

If you make changes directly in the Apps Script editor:

```bash
npm run pull
```

This downloads the latest code from Apps Script to your local `src/` directory.

## Common Issues

### "User has not enabled the Apps Script API"

**Solution:**
1. Visit https://script.google.com/home/usersettings
2. Turn on "Google Apps Script API"
3. Try `clasp login` again

### "Cannot find module"

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Syntax error" in Google Sheets

**Possible causes:**
1. Function name typo (it's `PECUNIA`, all caps)
2. Wrong number of parameters
3. Code not pushed to Apps Script

**Solution:**
1. Check formula syntax
2. Run `npm run push` to ensure latest code is deployed
3. Refresh your spreadsheet

### Tests pass but function doesn't work in Sheets

**Possible causes:**
1. Code not pushed to Apps Script
2. Old cache in Apps Script

**Solution:**
```bash
npm run push
```

Then in Google Sheets, go to **Extensions > Apps Script** and verify the code is there.

## Tips for Development

### Use Version Control

After initial setup:

```bash
git init
git add .
git commit -m "Initial commit"
```

### Create Multiple Environments

You can have separate Apps Script projects for development and production:

**Development:**
```json
// .clasp.dev.json
{
  "scriptId": "dev-script-id",
  "rootDir": "./src"
}
```

**Production:**
```json
// .clasp.prod.json
{
  "scriptId": "prod-script-id",
  "rootDir": "./src"
}
```

Deploy to dev:
```bash
clasp push --project .clasp.dev.json
```

Deploy to production:
```bash
clasp push --project .clasp.prod.json
```

### Enable Logger

View logs while testing:

1. In Apps Script editor, go to **View > Logs**
2. Or use Stackdriver Logging: **View > Stackdriver Logging**

### Debugging

Add breakpoints in Apps Script editor:
1. Click on line number to add breakpoint
2. Run function with debugger
3. Step through code

## Next Steps

1. Read the [README.md](README.md) for usage examples
2. Check out [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
3. Run `npm test` to ensure everything is working
4. Try the examples in the README in your sheet

## Getting Help

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [clasp Documentation](https://github.com/google/clasp)
- [Open an issue](https://github.com/yourusername/pecunia/issues)
