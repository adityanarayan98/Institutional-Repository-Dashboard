/**
 * Google Apps Script - CRIS Publication Portal (Google Sheets)
 * code.gs - Backend logic
 */

// Configuration - Your Google Sheet URL
const CONFIG = {
  // Replace with your Google Sheet URL (published as CSV)
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQSigVS_A_n_TZSN1Btu_koXZ4SJ509acGFS4vy9wtcQI5kUUAW1mwm9OiPrKWSbUETj5S3-GFanInd/pub?gid=0&single=true&output=csv",
  
  // Column mapping (adjust based on your sheet structure)
  columns: {
    title: "dc.title",
    authors: "dc.contributor.author",
    year: "dc.date.issued",
    type: "dc.type",
    source: "dc.source",
    uri: "dc.identifier.uri",
    doi: "dc.identifier.doi",
    department: "collection",
    language: "dc.language.iso",
    country: "dc.coverage.spatial",
    openAccess: "oaire.venue.unpaywall"
  }
};

// Collection code to Department mapping
const DEPT_MAPPING = {
  'INST2025/18072': 'Biological Engineering',
  'INST2025/18075': 'Chemical Engineering',
  'INST2025/18077': 'Chemistry',
  'INST2025/18079': 'Civil Engineering',
  'INST2025/18081': 'Cognitive Science',
  'INST2025/18083': 'Computer Science and Engineering',
  'INST2025/18085': 'Earth Sciences',
  'INST2025/18087': 'Electrical Engineering',
  'INST2025/18089': 'Humanities & Social Sciences',
  'INST2025/18093': 'Materials Engineering',
  'INST2025/18097': 'Mechanical Engineering',
  'INST2025/18073': 'Physics',
  'INST2025/18091': 'Central Library',
  'INST2025/18095': 'Mathematics',
  'INST2025/29424': 'Archaeology',
  'INST2025/29426': 'Center for Creative Learning (CCL)',
  'INST2025/29428': 'Design',
  'INST2025/33786': 'Physics (PRL)'
};

/**
 * Main doGet function - serves the HTML page
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('CRIS Publication Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Include HTML content from other files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get all publications from Google Sheet
 * @param {Object} filters - Filter parameters
 * @return {Object} Filtered results with facets
 */
function getPublications(filters) {
  const allItems = fetchSheetData();
  const processed = processItems(allItems);
  const filtered = applyFilters(processed, filters);
  const facets = buildFacets(processed);
  
  return {
    results: filtered.slice(0, 50),
    facets: facets,
    total: filtered.length
  };
}

/**
 * Fetch data from Google Sheet (CSV format)
 */
function fetchSheetData() {
  const options = {
    method: "GET",
    headers: {
      "User-Agent": "CRIS-Portal/1.0"
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(CONFIG.sheetCsvUrl, options);
    
    if (response.getResponseCode() !== 200) {
      Logger.log('Error fetching sheet: HTTP ' + response.getResponseCode());
      return [];
    }
    
    const csvContent = response.getContentText();
    return parseCSV(csvContent);
    
  } catch (error) {
    Logger.log('Error fetching sheet: ' + error.message);
    return [];
  }
}

/**
 * Parse CSV content into array of objects
 */
function parseCSV(csvContent) {
  const rows = csvContent.split('\n');
  if (rows.length < 2) return [];
  
  // Parse header row to get column names
  const headers = parseCSVRow(rows[0]);
  
  // Map headers to our column keys
  const colMap = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].trim().toLowerCase();
    // Match headers to our column names
    for (const key in CONFIG.columns) {
      if (CONFIG.columns[key].toLowerCase() === h || h.indexOf(key) !== -1) {
        colMap[key] = i;
        break;
      }
    }
  }
  
  // Parse data rows
  const items = [];
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].trim() === '') continue;
    
    const values = parseCSVRow(rows[r]);
    const item = {};
    
    // Map values to our columns
    if (colMap.title !== undefined) item.title = values[colMap.title] || '';
    if (colMap.authors !== undefined) item.authors = values[colMap.authors] || '';
    if (colMap.year !== undefined) item.year = values[colMap.year] || '';
    if (colMap.type !== undefined) item.type = values[colMap.type] || '';
    if (colMap.source !== undefined) item.source = values[colMap.source] || '';
    if (colMap.uri !== undefined) item.uri = values[colMap.uri] || '';
    if (colMap.doi !== undefined) item.doi = values[colMap.doi] || '';
    if (colMap.department !== undefined) item.department = values[colMap.department] || '';
    if (colMap.language !== undefined) item.language = values[colMap.language] || '';
    if (colMap.country !== undefined) item.country = values[colMap.country] || '';
    if (colMap.openAccess !== undefined) item.openAccess = values[colMap.openAccess] || '';
    
    if (item.title) {
      items.push(item);
    }
  }
  
  return items;
}

/**
 * Parse a single CSV row (handle quoted fields)
 */
function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Process items into cleaner format
 */
function processItems(items) {
  const publications = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    const pub = {
      id: (i + 1).toString(),
      title: item.title || 'Untitled',
      authors: item.authors || '',
      year: extractYear(item.year || ''),
      type: item.type || '',
      source: item.source || '',
      doi: item.doi || '',
      uri: item.uri || '',
      department: getDepartment(item.department || ''),
      language: item.language || '',
      country: item.country || '',
      openAccess: item.openAccess || ''
    };
    
    publications.push(pub);
  }
  
  return publications;
}

/**
 * Extract year from date string
 */
function extractYear(dateStr) {
  if (!dateStr) return '';
  const match = dateStr.match(/^\d{4}/);
  return match ? match[0] : '';
}

/**
 * Map collection codes to department names
 */
function getDepartment(collectionCodes) {
  if (!collectionCodes) return '';
  
  const codes = collectionCodes.split('||').map(function(c) {
    return c.trim();
  });
  
  if (codes.indexOf('INST2025/33786') >= 0 && codes.indexOf('INST2025/18073') >= 0) {
    return 'Physics (PRL)';
  }
  
  const departments = [];
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (DEPT_MAPPING[code]) {
      departments.push(DEPT_MAPPING[code]);
    }
  }
  
  return [...new Set(departments)].join('; ');
}

/**
 * Apply filters to publications
 */
function applyFilters(publications, filters) {
  if (!filters) return publications;
  
  let filtered = publications;
  
  // Search query
  if (filters.query && filters.query.trim() !== '') {
    const q = filters.query.toLowerCase();
    filtered = filtered.filter(function(pub) {
      const searchText = (pub.title + ' ' + pub.authors + ' ' + pub.type).toLowerCase();
      return searchText.indexOf(q) !== -1;
    });
  }
  
  // Author filter
  if (filters.authors && filters.authors.length > 0) {
    filtered = filtered.filter(function(pub) {
      const authorList = pub.authors.split('||').map(function(a) { return a.trim(); });
      return filters.authors.some(function(fa) { 
        return authorList.indexOf(fa) !== -1; 
      });
    });
  }
  
  // Year filter
  if (filters.years && filters.years.length > 0) {
    filtered = filtered.filter(function(pub) {
      return filters.years.indexOf(pub.year) !== -1;
    });
  }
  
  // Type filter
  if (filters.types && filters.types.length > 0) {
    filtered = filtered.filter(function(pub) {
      const typeList = pub.type.split('||').map(function(t) { return t.trim(); });
      return filters.types.some(function(ft) { 
        return typeList.indexOf(ft) !== -1; 
      });
    });
  }
  
  // Department filter
  if (filters.departments && filters.departments.length > 0) {
    filtered = filtered.filter(function(pub) {
      const deptList = pub.department.split(';').map(function(d) { return d.trim(); });
      return filters.departments.some(function(fd) { 
        return deptList.indexOf(fd) !== -1; 
      });
    });
  }
  
  return filtered;
}

/**
 * Build facets from publications
 */
function buildFacets(publications) {
  const facets = {
    authors: {},
    years: {},
    types: {},
    departments: {}
  };
  
  for (let i = 0; i < publications.length; i++) {
    const pub = publications[i];
    
    // Authors (only Institution authors - marked with ::500)
    if (pub.authors) {
      const authorList = pub.authors.split('||');
      for (let j = 0; j < authorList.length; j++) {
        const author = authorList[j].trim();
        if (author.indexOf('::500') !== -1) {
          const cleanName = author.split('::')[0].trim();
          if (cleanName) {
            facets.authors[cleanName] = (facets.authors[cleanName] || 0) + 1;
          }
        }
      }
    }
    
    // Years
    if (pub.year) {
      facets.years[pub.year] = (facets.years[pub.year] || 0) + 1;
    }
    
    // Types
    if (pub.type) {
      const typeList = pub.type.split('||');
      for (let j = 0; j < typeList.length; j++) {
        const t = typeList[j].trim();
        if (t) {
          facets.types[t] = (facets.types[t] || 0) + 1;
        }
      }
    }
    
    // Departments
    if (pub.department) {
      const deptList = pub.department.split(';');
      for (let j = 0; j < deptList.length; j++) {
        const d = deptList[j].trim();
        if (d) {
          facets.departments[d] = (facets.departments[d] || 0) + 1;
        }
      }
    }
  }
  
  // Sort facets
  facets.years = sortObjectByKeys(facets.years, true);
  facets.authors = sortObjectByValues(facets.authors);
  facets.types = sortObjectByValues(facets.types);
  facets.departments = sortObjectByValues(facets.departments);
  
  return facets;
}

/**
 * Sort object by keys
 */
function sortObjectByKeys(obj, desc) {
  const keys = Object.keys(obj).sort();
  if (desc) keys.reverse();
  const sorted = {};
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}

/**
 * Sort object by values (descending)
 */
function sortObjectByValues(obj) {
  const entries = Object.entries(obj);
  entries.sort(function(a, b) { return b[1] - a[1]; });
  const sorted = {};
  for (let i = 0; i < entries.length; i++) {
    sorted[entries[i][0]] = entries[i][1];
  }
  return sorted;
}

/**
 * Test function
 */
function testFetch() {
  const items = fetchSheetData();
  Logger.log('Fetched ' + items.length + ' rows');
  
  const processed = processItems(items);
  Logger.log('Processed ' + processed.length + ' publications');
  
  const facets = buildFacets(processed);
  Logger.log('Authors: ' + Object.keys(facets.authors).length);
  Logger.log('Years: ' + Object.keys(facets.years).length);
  Logger.log('Types: ' + Object.keys(facets.types).length);
  
  return processed;
}
