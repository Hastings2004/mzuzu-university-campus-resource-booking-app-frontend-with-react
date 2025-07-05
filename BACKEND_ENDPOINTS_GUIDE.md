# Backend Endpoints Guide for Recommendation System

## Required Laravel Routes

Add these routes to your `routes/api.php` file:

```php
// Recommendation endpoints
Route::get('/resources/recommendations', [ResourceController::class, 'getRecommendations']);
Route::get('/resources/time-based-recommendations', [ResourceController::class, 'getTimeBasedRecommendations']);
Route::get('/user/preferences', [ResourceController::class, 'getUserPreferences']);

// Optional endpoints (for enhanced features)
Route::get('/resources/trending', [ResourceController::class, 'getTrendingResources']);
Route::get('/user/recent-bookings', [ResourceController::class, 'getRecentBookings']);
Route::get('/resources/{resource}/similar', [ResourceController::class, 'getSimilarResources']);
Route::get('/resources/{resource}/availability', [ResourceController::class, 'getResourceAvailability']);
```

## Required Controller Methods

Add these methods to your `ResourceController.php`:

### 1. Get Trending Resources (Optional)
```php
public function getTrendingResources(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json([
            "success" => false,
            "message" => "Unauthenticated."
        ], 401);
    }

    $limit = $request->query('limit', 6);
    
    try {
        // Get resources with increasing booking trends
        $trendingResources = Resource::withCount(['bookings' => function($query) {
            $query->where('created_at', '>=', now()->subDays(30));
        }])
        ->orderBy('bookings_count', 'desc')
        ->limit($limit)
        ->get();

        return response()->json([
            "success" => true,
            "resources" => $trendingResources
        ]);
    } catch (\Exception $e) {
        Log::error('ResourceController@getTrendingResources failed: ' . $e->getMessage());
        return response()->json([
            "success" => false,
            "message" => "An unexpected error occurred while fetching trending resources."
        ], 500);
    }
}
```

### 2. Get Recent Bookings (Optional)
```php
public function getRecentBookings(Request $request)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json([
            "success" => false,
            "message" => "Unauthenticated."
        ], 401);
    }

    $limit = $request->query('limit', 5);
    
    try {
        $recentBookings = $user->bookings()
            ->with('resource')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            "success" => true,
            "bookings" => $recentBookings
        ]);
    } catch (\Exception $e) {
        Log::error('ResourceController@getRecentBookings failed: ' . $e->getMessage());
        return response()->json([
            "success" => false,
            "message" => "An unexpected error occurred while fetching recent bookings."
        ], 500);
    }
}
```

### 3. Get Similar Resources (Optional)
```php
public function getSimilarResources(Request $request, Resource $resource)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json([
            "success" => false,
            "message" => "Unauthenticated."
        ], 401);
    }

    $limit = $request->query('limit', 4);
    
    try {
        // Find similar resources based on category and capacity
        $similarResources = Resource::where('id', '!=', $resource->id)
            ->where('category', $resource->category)
            ->whereBetween('capacity', [
                $resource->capacity * 0.7,
                $resource->capacity * 1.3
            ])
            ->limit($limit)
            ->get();

        return response()->json([
            "success" => true,
            "resources" => $similarResources
        ]);
    } catch (\Exception $e) {
        Log::error('ResourceController@getSimilarResources failed: ' . $e->getMessage());
        return response()->json([
            "success" => false,
            "message" => "An unexpected error occurred while fetching similar resources."
        ], 500);
    }
}
```

### 4. Get Resource Availability (Optional)
```php
public function getResourceAvailability(Request $request, Resource $resource)
{
    $user = Auth::user();
    if (!$user) {
        return response()->json([
            "success" => false,
            "message" => "Unauthenticated."
        ], 401);
    }

    $date = $request->query('date');
    
    if (!$date) {
        return response()->json([
            "success" => false,
            "message" => "Date parameter is required."
        ], 400);
    }

    try {
        $dateObj = Carbon::parse($date);
        
        // Get existing bookings for the date
        $existingBookings = $resource->bookings()
            ->whereDate('start_time', $dateObj)
            ->get();

        // Generate available time slots (example: 9 AM to 6 PM, 1-hour slots)
        $availableSlots = [];
        $startHour = 9;
        $endHour = 18;
        
        for ($hour = $startHour; $hour < $endHour; $hour++) {
            $slotStart = $dateObj->copy()->setTime($hour, 0);
            $slotEnd = $dateObj->copy()->setTime($hour + 1, 0);
            
            // Check if slot is available
            $conflictingBooking = $existingBookings->first(function($booking) use ($slotStart, $slotEnd) {
                return $booking->start_time < $slotEnd && $booking->end_time > $slotStart;
            });
            
            if (!$conflictingBooking) {
                $availableSlots[] = [
                    'start_time' => $slotStart->format('H:i'),
                    'end_time' => $slotEnd->format('H:i'),
                    'available' => true
                ];
            }
        }

        return response()->json([
            "success" => true,
            "timeSlots" => $availableSlots
        ]);
    } catch (\Exception $e) {
        Log::error('ResourceController@getResourceAvailability failed: ' . $e->getMessage());
        return response()->json([
            "success" => false,
            "message" => "An unexpected error occurred while fetching availability."
        ], 500);
    }
}
```

## Required Models and Relationships

Make sure your models have the necessary relationships:

### User Model
```php
public function bookings()
{
    return $this->hasMany(Booking::class);
}
```

### Resource Model
```php
public function bookings()
{
    return $this->hasMany(Booking::class);
}
```

### Booking Model
```php
public function user()
{
    return $this->belongsTo(User::class);
}

public function resource()
{
    return $this->belongsTo(Resource::class);
}
```

## Database Requirements

Ensure your database has these tables with proper relationships:

1. **users** table
2. **resources** table (with category, capacity fields)
3. **bookings** table (with user_id, resource_id, start_time, end_time, status fields)

## Testing the Endpoints

You can test the endpoints using curl or Postman:

```bash
# Test personalized recommendations
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://your-domain.com/api/resources/recommendations

# Test user preferences
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://your-domain.com/api/user/preferences

# Test trending resources
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://your-domain.com/api/resources/trending?limit=6
```

## Error Handling

The frontend is designed to handle missing endpoints gracefully:
- If an endpoint doesn't exist, it will show an empty state instead of an error
- Popular and trending resources fall back to regular resources
- Recent bookings and similar resources show empty states when not available

## Performance Considerations

1. **Add Database Indexes**:
```sql
-- Add indexes for better performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
```

2. **Caching** (Optional):
```php
// Cache popular recommendations for 1 hour
Cache::remember('popular_resources', 3600, function () {
    return Resource::withCount('bookings')->orderBy('bookings_count', 'desc')->limit(8)->get();
});
```

## Implementation Priority

1. **High Priority** (Required for basic functionality):
   - `/api/resources/recommendations`
   - `/api/user/preferences`

2. **Medium Priority** (Enhanced features):
   - `/api/resources/time-based-recommendations`
   - `/api/resources/trending`

3. **Low Priority** (Nice to have):
   - `/api/user/recent-bookings`
   - `/api/resources/{resource}/similar`
   - `/api/resources/{resource}/availability`

The frontend will work with just the high priority endpoints, and additional features will be enabled as you implement more endpoints. 