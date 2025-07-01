# Document Metadata API Endpoint

## Endpoint
`GET /api/bookings/{bookingId}/document-metadata`

## Description
This endpoint returns metadata about the supporting document associated with a booking, including file information like filename, size, type, and upload date.

## Authentication
Requires Bearer token authentication.

## Request Headers
```
Authorization: Bearer {token}
Accept: application/json
```

## Response Format

### Success Response (200 OK)
```json
{
  "exists": true,
  "filename": "supporting_document.pdf",
  "size": 245760,
  "mime_type": "application/pdf",
  "uploaded_at": "2024-01-15T10:30:00Z",
  "file_path": "/uploads/documents/booking_123_document.pdf",
  "checksum": "a1b2c3d4e5f6...",
  "description": "Supporting document for booking"
}
```

### Document Not Found (404 Not Found)
```json
{
  "exists": false,
  "error": "Document not found for this booking",
  "message": "No supporting document associated with this booking"
}
```

### Unauthorized (401 Unauthorized)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Forbidden (403 Forbidden)
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this document"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `exists` | boolean | Whether the document exists |
| `filename` | string | Original filename of the document |
| `size` | integer | File size in bytes |
| `mime_type` | string | MIME type of the file |
| `uploaded_at` | string | ISO 8601 timestamp of when the file was uploaded |
| `file_path` | string | Server path to the file (optional) |
| `checksum` | string | File checksum for integrity verification (optional) |
| `description` | string | Description or notes about the document (optional) |
| `error` | string | Error message if document doesn't exist or can't be accessed |

## Example Usage

### Frontend Implementation
```javascript
const fetchDocumentMetadata = async (bookingId) => {
  try {
    const response = await fetch(`/api/bookings/${bookingId}/document-metadata`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const metadata = await response.json();
      return metadata;
    } else if (response.status === 404) {
      return { exists: false, error: 'Document not found' };
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch metadata');
    }
  } catch (error) {
    console.error('Error fetching document metadata:', error);
    return { exists: false, error: error.message };
  }
};
```

### Backend Implementation (Laravel Example)
```php
public function getDocumentMetadata($bookingId)
{
    $booking = Booking::findOrFail($bookingId);
    
    // Check if user has permission to view this booking's document
    if (!auth()->user()->can('view', $booking)) {
        return response()->json([
            'error' => 'Forbidden',
            'message' => 'You don\'t have permission to access this document'
        ], 403);
    }
    
    if (!$booking->supporting_document) {
        return response()->json([
            'exists' => false,
            'error' => 'Document not found for this booking',
            'message' => 'No supporting document associated with this booking'
        ], 404);
    }
    
    $filePath = storage_path('app/' . $booking->supporting_document);
    
    if (!file_exists($filePath)) {
        return response()->json([
            'exists' => false,
            'error' => 'File not found on server',
            'message' => 'Document file is missing from server'
        ], 404);
    }
    
    $fileInfo = pathinfo($filePath);
    $fileSize = filesize($filePath);
    $mimeType = mime_content_type($filePath);
    
    return response()->json([
        'exists' => true,
        'filename' => $fileInfo['basename'],
        'size' => $fileSize,
        'mime_type' => $mimeType,
        'uploaded_at' => $booking->updated_at->toISOString(),
        'file_path' => $booking->supporting_document,
        'checksum' => hash_file('sha256', $filePath),
        'description' => 'Supporting document for booking #' . $booking->id
    ]);
}
```

## Benefits

1. **Performance**: Avoid unnecessary document downloads when only metadata is needed
2. **User Experience**: Show file information before allowing download/view
3. **Security**: Validate document existence and permissions before serving files
4. **Caching**: Metadata can be cached separately from large files
5. **Error Handling**: Provide clear feedback when documents are unavailable

## Integration with Frontend

The frontend now:
- Fetches metadata before showing document buttons
- Displays file information (name, size, type, upload date)
- Shows appropriate file icons based on file type
- Handles loading states and error messages
- Only shows View/Download buttons when document exists 