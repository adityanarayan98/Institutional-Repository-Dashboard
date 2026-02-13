# Institutional-Repository-Dashboard
Institutional Repository Dashboard, using DSpace data or any CSV file 

# CRIS Publication Portal - Google Apps Script

A faceted search web application for publication data stored in Google Sheets. Built with Google Apps Script (HTML Service).

## Features

- 📊 Fetches data directly from Google Sheets (CSV format)
- 🔍 Full-text search across publications
- 🏷️ Faceted filtering:
  - Authors (Institution only)
  - Year
  - Publication Type
  - Department
- 📱 Responsive design (works on mobile & desktop)
- 🎨 Modern UI with clean design

## Prerequisites

1. A Google Account (to access Google Apps Script)
2. A Google Sheet with publication data
3. The sheet must be published to the web as CSV

## Google Sheet Format

Your Google Sheet should have these columns (column headers should match or be similar to):

| Column | Dublin Core Field | Example |
|--------|------------------|---------|
| Title | dc.title | "Machine Learning for..." |
| Authors | dc.contributor.author | "John Doe::500\|\|Jane Smith" |
| Year | dc.date.issued | "2024" |
| Type | dc.type | "Article\|\|Conference Paper" |
| Source | dc.source | "Nature" |
| DOI | dc.identifier.doi | "10.1000/xyz" |
| URI | dc.identifier.uri | "https://..." |
| Department | collection | "INST2025/18083" |
| Language | dc.language.iso | "en" |
| Country | dc.coverage.spatial | "India" |
| Open Access | oaire.venue.unpaywall | "true" |

### Important Notes

- **Institution Authors**: Add `::500` suffix to mark institution authors (e.g., "John Doe::500")
- **Multiple Values**: Use `||` separator for multiple values (e.g., "Author1||Author2")
- **Department Codes**: Use collection codes from the mapping in the code

## Deployment Steps

### Step 1: Prepare Your Google Sheet

1. Open your Google Sheet with publication data
2. Make sure column headers are in the first row
3. Go to **File → Share → Publish to web**
4. Select **"Entire document"** and **"Comma-separated values (.csv)"**
5. Click **Publish** and copy the generated URL

### Step 2: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New project"**
3. Delete any existing code in `Code.gs`

### Step 3: Add Code Files

#### Option A: Using the Editor

1. Rename `Code.gs` to your existing file (or create new)
2. Copy the contents of [`code.gs`](code.gs) into the code editor
3. Click **File → New → HTML file**
4. Name it `index`
5. Copy the contents of [`index.html`](index.html) into the editor

#### Option B: Using Clasp (Command Line)

```bash
# Install clasp
npm install -g @google/clasp

# Login
clasp login

# Create new project
clasp create cris-portal --type webapp

# Push files
clasp push code.gs index.html

# Open in editor
clasp open
```

### Step 4: Configure the Sheet URL

In `code.gs`, find this line and replace with your CSV URL:

```javascript
const CONFIG = {
  sheetCsvUrl: "YOUR_GOOGLE_SHEET_CSV_URL_HERE",
  // ...
};
```

### Step 5: Test the Application

1. Click the **Run** icon (▶️) or select **Run → Run function → doGet**
2. If prompted, authorize the script (select your account, click Advanced → Go to (unsafe) → Allow)
3. Click the **Deploy** button (blue) → **New deployment**
4. Select **Web app** as the type
5. Configure:
   - Description: "CRIS Portal v1"
   - Execute as: "Me"
   - Who has access: "Anyone" or "Anyone with Google Account"
6. Click **Deploy**
7. Copy the web app URL

### Step 6: Access Your Portal

Open the deployed URL in your browser. You should see:
- Search bar at the top
- Faceted filters on the left sidebar
- Publication results in the main area

## How It Works

### Data Flow

```
Google Sheet → Published CSV → Google Apps Script → HTML Interface
```

1. **Data Source**: The app fetches CSV data from your published Google Sheet
2. **Processing**: The script parses CSV and processes metadata
3. **Facets**: Builds filter counts from the data
4. **UI**: HTML/JavaScript displays results with filtering

### Key Functions

| Function | Purpose |
|----------|---------|
| `doGet()` | Serves the HTML page |
| `fetchSheetData()` | Fetches CSV from Google Sheets |
| `parseCSV()` | Parses CSV into objects |
| `processItems()` | Cleans and formats data |
| `buildFacets()` | Creates filter counts |
| `applyFilters()` | Filters data based on user input |

## Customization

<img width="1413" height="755" alt="image" src="https://github.com/user-attachments/assets/5b9ea534-cddc-43c3-a731-8b0b7e07251b" />
<img width="1428" height="855" alt="image" src="https://github.com/user-attachments/assets/2488a8d4-57fb-4405-b7ba-42e9620f4c99" />


### Adding New Filters

1. Add the field to `CONFIG.columns` in `code.gs`
2. Update `processItems()` to include the new field
3. Update `buildFacets()` to create facets for the new field
4. Add filter UI in `index.html`

### Changing Department Mapping

Edit the `DEPT_MAPPING` object in `code.gs`:

```javascript
const DEPT_MAPPING = {
  'CODE_1': 'Department Name',
  'CODE_2': 'Another Department',
  // Add more...
};
```

### Styling

Edit the CSS in `index.html` to match your organization's branding.

## Troubleshooting

### "Loading..." never completes

- Check if the CSV URL is correct and publicly accessible
- Open the CSV URL directly in browser to verify

### No results appearing

- Check that column headers match expected format
- Verify data is in the correct columns

### Filters not working

- Ensure CSV has valid data in the filter columns
- Check browser console for JavaScript errors

## Files

| File | Description |
|------|-------------|
| `code.gs` | Backend logic (data fetching, processing, filtering) |
| `index.html` | Frontend UI (HTML, CSS, JavaScript) |

## License

MIT License - Feel free to use and modify for your institution.

## Support

For issues or questions, please open an issue in the project repository.
