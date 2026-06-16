import * as FileSystem from 'expo-file-system'
import Papa from 'papaparse'

/**
 * Read a file from a URI and parse it based on extension.
 * Returns a plain text string ready to be sent to Claude.
 */
export async function parseFile(fileUri, fileName) {
  const ext = (fileName || fileUri).split('.').pop().toLowerCase()

  if (ext === 'pdf') {
    return {
      success: false,
      error: 'PDF files are not supported on mobile. Please export your bank statement as a CSV or TXT file, or use the "Paste Text" option to paste copied text from your PDF.'
    }
  }

  try {
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8
    })

    if (ext === 'csv') {
      return { success: true, text: csvToText(content) }
    }

    // TXT or any other text format
    return { success: true, text: content }
  } catch (err) {
    return { success: false, error: `Failed to read file: ${err.message}` }
  }
}

/**
 * Parse a CSV string and convert it to a human-readable text table
 * that Claude can understand.
 */
function csvToText(csvString) {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true
  })

  if (!result.data || result.data.length === 0) {
    return csvString // Return raw if parsing fails
  }

  const headers = Object.keys(result.data[0]).join(', ')
  const rows = result.data.map(row => Object.values(row).join(', ')).join('\n')
  return `${headers}\n${rows}`
}
