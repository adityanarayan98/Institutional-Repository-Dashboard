# Institution Publication Portal - Google Apps Script

A faceted search web application for publication data stored in CSV format. Built with Google Apps Script (HTML Service).

## Features

- 🔍 Full-text search across publications
- 🏷️ Faceted filtering:
  - Year
  - Publication Type
  - Department
  - Author
  - Source Title
  - Country
  - Open Access Status
- 📱 Desktop-optimized design
- 🎨 Modern UI with clean design

## Prerequisites

1. A Google Account (to access Google Apps Script)
2. A CSV file with publication data

## CSV Data Format

Your CSV file should have these columns:

| Column | Description |
|--------|-------------|
| department | Author's department |
| author | Publication authors (separated by `\|\|`) |
| year | Publication year |
| doi | Digital Object Identifier |
| link | URL to publication |
| language | Language |
| journal | Journal or conference name |
| title | Publication title |
| type | Publication type (Article, Review, Conference Paper, etc.) |
| openaccess | Open access status (gold, hybrid, close) |
| country | Country of publication |

### Sample CSV

A sample CSV file (`sample_publications.csv`) is included with example data.

## Deployment Steps

### Step 1: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New project"**
3. Delete any existing code in `Code.gs`

### Step 2: Add Code Files

1. Copy the contents of [`Code.gs`](Code.gs) into the code editor
2. Click **File → New → HTML file**
3. Name it `PublicationsPage`
4. Copy the contents of [`PublicationsPage.html`](PublicationsPage.html) into the editor

### Step 3: Configure the CSV File

In `Code.gs`, find this line and replace with your CSV URL:

```javascript
const CSV_URL = "YOUR_CSV_URL_HERE";
var SPREADSHEET_ID = "YOUR_REPOSITORY_URL_HERE";
var PERFORMANCE_LOG_SHEET_ID = "YOUR_LOG_URL_HERE";
```

### Step 4: Test the Application

1. Click the **Run** icon (▶️) or select **Run → Run function → doGet**
2. If prompted, authorize the script (select your account, click Advanced → Go to (unsafe) → Allow)
3. Click the **Deploy** button (blue) → **New deployment**
4. Select **Web app** as the type
5. Configure:
   - Description: "Publications Portal v1"
   - Execute as: "Me"
   - Who has access: "Anyone" or "Anyone with Google Account"
6. Click **Deploy**
7. Copy the web app URL

### Step 5: Access Your Portal

Open the deployed URL in your browser. You should see:
- Search bar at the top
- Faceted filters on the left sidebar
- Publication results in the main area

## How It Works

### Data Flow

```
CSV File → Google Apps Script → HTML Interface
```

1. **Data Source**: The app fetches CSV data
2. **Processing**: The script parses CSV and processes metadata
3. **Facets**: Builds filter counts from the data
4. **UI**: HTML/JavaScript displays results with filtering

### Key Functions

| Function | Purpose |
|----------|---------|
| `doGet()` | Serves the HTML page |
| `getData()` | Fetches and returns CSV data |

## Files

| File | Description |
|------|-------------|
| `Code.gs` | Backend logic (data fetching, processing, filtering) |
| `PublicationsPage.html` | Frontend UI (HTML, CSS, JavaScript) |
| `sample_publications.csv` | Sample data file |
| `README.md` | This file |

## Dashboard
<img width="1045" height="609" alt="image" src="https://github.com/user-attachments/assets/7bef811f-4781-467f-9bda-1dd06bd654e7" />
<img width="982" height="592" alt="image" src="https://github.com/user-attachments/assets/1ccc7c97-3464-4459-acd8-af90aaa5c7cc" />



## Contributor
1. Aditya Narayan Sahoo



## License

MIT License - Feel free to use and modify for your institution.
