 * Google Apps Script - Server Side Code
 * Publication Viewer with Google Sheets data

// Configuration - Your Google Sheet URL
// ============ CONFIGURATION - UPDATE THIS SPREADSHEET ID ============
// Get ID from your Google Sheet URL: docs.google.com/spreadsheets/d/THIS_PART/edit
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// Field mapping - column names in your Google Sheet
var FIELD_MAPPING = {
  title: 'title',
  author: 'author',
  year: 'year',
  journal: 'journal',
  source: 'journal',  // Source mapped to journal
  type: 'type',
  doi: 'doi',
  department: 'department',
  link: 'link',
  openaccess: 'openaccess',
  country: 'country'
};

// =========================================================

function doGet() {
  return HtmlService.createTemplateFromFile('PublicationsPage')
      .evaluate()
      .setTitle('Publications')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Get all publications from Google Sheet using SpreadsheetApp
 */
function getAllPublications() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.indexOf('YOUR_') !== -1) {
    return [];
  }
  
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheets()[0]; // First sheet
    var data = sheet.getDataRange().getValues();
    
    return processSheetData(data);
  } catch (e) {
    Logger.log('Error: ' + e.message);
    return [];
  }
}

/**
 * Process data from Google Sheet
 */
function processSheetData(data) {
  if (data.length < 2) return [];
  
  var headers = data[0].map(function(h) { 
    return String(h).trim().toLowerCase().replace(/\s+/g, '');
  });
  
  var publications = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row.length < headers.length) continue;
    
    var pub = {};
    for (var j = 0; j < headers.length; j++) {
      pub[headers[j]] = String(row[j] || '').trim();
    }
    
    if (pub.title) {
      publications.push(processPublication(pub, 'publications'));
    }
  }
  
  return publications;
}

/**
 * Get field value from row
 */
function getFieldValue(row, fieldName) {
  if (!fieldName) return '';
  return row[fieldName] || '';
}

/**
 * Process a single publication record
 * Key: Authors are NOT bolded (this is the key difference)
 */
function processPublication(pub, source) {
  // Simple field extraction
  var title = getFieldValue(pub, FIELD_MAPPING.title);
  var authorStr = getFieldValue(pub, FIELD_MAPPING.author);
  var year = getFieldValue(pub, FIELD_MAPPING.year);
  var journal = getFieldValue(pub, FIELD_MAPPING.journal);
  var type = getFieldValue(pub, FIELD_MAPPING.type);
  var doi = getFieldValue(pub, FIELD_MAPPING.doi);
  var deptStr = getFieldValue(pub, FIELD_MAPPING.department);
  var link = getFieldValue(pub, FIELD_MAPPING.link);
  var openaccess = getFieldValue(pub, FIELD_MAPPING.openaccess);
  var country = getFieldValue(pub, FIELD_MAPPING.country);
  
  // Source = journal for facet
  var source = journal;
  
  // Parse authors - NO BOLDING
  var authors = parseAuthorsSimple(authorStr);
  
  // Parse department - separate field
  var department = parseDepartmentSimple(deptStr);
  
  // Build link from DOI if not provided
  if (!link && doi) {
    link = 'https://doi.org/' + doi;
  }
  
  return {
    title: title || 'Untitled',
    authors: authors.display,
    authorList: authors.list,
    iitgnAuthors: authors.iitgn,
    year: year || 'N/A',
    type: type || 'Publication',
    department: department.display,
    deptList: department.list,
    journal: journal || '',
    doi: doi || '',
    link: link || '',
    source: source,
    openaccess: openaccess || '',
    country: country || ''
  };
}

/**
 * Parse author string - NO BOLDING
 * Simple: split by | or ; or ,
 */
function parseAuthorsSimple(authorString) {
  var authors = [];
  var iitgnAuthors = [];
  var displayParts = [];
  
  if (!authorString) {
    return { display: '', list: [], iitgn: [] };
  }
  
  // Split by || or ; or ,
  var parts = authorString.split(/\|\||;|,\s*/);
  
  for (var i = 0; i < parts.length; i++) {
    var name = parts[i].trim();
    if (!name) continue;
    
    // Remove ::500 or ### suffixes
    name = name.split('::')[0].split('###')[0].trim();
    
    authors.push(name);
    
    // Check if IITGN (by ::500 suffix or affiliation)
    var isIITGN = parts[i].indexOf('::500') !== -1 || 
                  parts[i].toLowerCase().indexOf('iit gandhinagar') !== -1;
    
    if (isIITGN) {
      iitgnAuthors.push(name);
    }
    
    // NO BOLDING - just add name as-is
    displayParts.push(name);
  }
  
  // Join with " and " before last author
  var display = '';
  if (displayParts.length > 1) {
    var lastAuthor = displayParts.pop();
    display = displayParts.join('; ') + ' and ' + lastAuthor;
  } else {
    display = displayParts.join('; ');
  }
  
  return {
    display: display,
    list: authors,
    iitgn: iitgnAuthors
  };
}

/**
 * Parse department string - separate field
 */
function parseDepartmentSimple(deptString) {
  var deptList = [];
  
  if (!deptString) {
    return { display: '', list: [] };
  }
  
  // Split by || or ; or ,
  var parts = deptString.split(/\|\||;|,\s*/);
  
  for (var i = 0; i < parts.length; i++) {
    var dept = parts[i].trim();
    if (dept) {
      deptList.push(dept);
    }
  }
  
  return {
    display: deptList.join('; '),
    list: deptList
  };
}

/**
 * Get facets from all publications
 * Used for filtering - facet and search in same column
 */
function getFacets(publications) {
  var facets = {
    authors: {},
    departments: {},
    types: {},
    years: {},
    sources: {},
    openaccess: {},
    countries: {}
  };
  
  for (var i = 0; i < publications.length; i++) {
    var pub = publications[i];
    
    // Authors - ALL authors for facets (not just IITGN)
    if (pub.authorList) {
      for (var j = 0; j < pub.authorList.length; j++) {
        var author = pub.authorList[j];
        if (author) {
          facets.authors[author] = (facets.authors[author] || 0) + 1;
        }
      }
    }
    
    // Departments
    if (pub.deptList) {
      for (var j = 0; j < pub.deptList.length; j++) {
        var dept = pub.deptList[j];
        facets.departments[dept] = (facets.departments[dept] || 0) + 1;
      }
    }
    
    // Types
    if (pub.type) {
      facets.types[pub.type] = (facets.types[pub.type] || 0) + 1;
    }
    
    // Years
    if (pub.year && pub.year !== 'N/A') {
      facets.years[pub.year] = (facets.years[pub.year] || 0) + 1;
    }
    
    // Sources
    if (pub.source) {
      facets.sources[pub.source] = (facets.sources[pub.source] || 0) + 1;
    }
    
    // Open Access
    if (pub.openaccess) {
      facets.openaccess[pub.openaccess] = (facets.openaccess[pub.openaccess] || 0) + 1;
    }
    
    // Countries
    if (pub.country) {
      facets.countries[pub.country] = (facets.countries[pub.country] || 0) + 1;
    }
  }
  
  // Sort facets by count descending
  facets.authors = sortByCount(facets.authors);
  facets.departments = sortByCount(facets.departments);
  facets.types = sortByCount(facets.types);
  facets.years = sortByCount(facets.years);
  facets.sources = sortByCount(facets.sources);
  facets.openaccess = sortByCount(facets.openaccess);
  facets.countries = sortByCount(facets.countries);
  
  return facets;
}

/**
 * Sort object by count value descending
 */
function sortByCount(obj) {
  var sorted = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      sorted.push({ name: key, count: obj[key] });
    }
  }
  sorted.sort(function(a, b) { return b.count - a.count; });
  return sorted;
}

/**
 * Filter publications based on search and filters
 */
function filterPublications(publications, query, filters) {
  var results = [];
  
  for (var i = 0; i < publications.length; i++) {
    var pub = publications[i];
    var matches = true;
    
    // Search query
    if (query) {
      var searchText = (pub.title + ' ' + pub.authors + ' ' + pub.journal).toLowerCase();
      if (searchText.indexOf(query.toLowerCase()) === -1) {
        matches = false;
      }
    }
    
    // Author filter
    if (matches && filters.author && filters.author.length > 0) {
      var authorMatch = false;
      for (var j = 0; j < pub.authorList.length; j++) {
        if (filters.author.indexOf(pub.authorList[j]) !== -1) {
          authorMatch = true;
          break;
        }
      }
      if (!authorMatch) matches = false;
    }
    
    // Department filter
    if (matches && filters.department && filters.department.length > 0) {
      var deptMatch = false;
      for (var j = 0; j < pub.deptList.length; j++) {
        if (filters.department.indexOf(pub.deptList[j]) !== -1) {
          deptMatch = true;
          break;
        }
      }
      if (!deptMatch) matches = false;
    }
    
    // Year filter
    if (matches && filters.year && filters.year.length > 0) {
      if (filters.year.indexOf(pub.year) === -1) {
        matches = false;
      }
    }
    
    // Type filter
    if (matches && filters.type && filters.type.length > 0) {
      if (filters.type.indexOf(pub.type) === -1) {
        matches = false;
      }
    }
    
    // Source filter
    if (matches && filters.source && filters.source.length > 0) {
      if (filters.source.indexOf(pub.source) === -1) {
        matches = false;
      }
    }
    
    // Open Access filter
    if (matches && filters.openaccess && filters.openaccess.length > 0) {
      if (filters.openaccess.indexOf(pub.openaccess) === -1) {
        matches = false;
      }
    }
    
    // Country filter
    if (matches && filters.country && filters.country.length > 0) {
      if (filters.country.indexOf(pub.country) === -1) {
        matches = false;
      }
    }
    
    if (matches) {
      results.push(pub);
    }
  }
  
  return results;
}

/**
 * Include external HTML file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get all publications with facets
 */
function getAllPublicationsWithFacets() {
  try {
    var allPubs = getAllPublications();
    var facets = getFacets(allPubs);
    
    return {
      publications: allPubs,
      totalCount: allPubs.length,
      facets: facets
    };
    
  } catch (e) {
    Logger.log('Load error: ' + e.message);
    return { error: e.message, publications: [], facets: {} };
  }
}
