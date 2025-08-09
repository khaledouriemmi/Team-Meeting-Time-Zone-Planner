# Time Zone Meeting Planner

A web-based tool to help plan meetings across different time zones. This tool makes it easy to find overlapping working hours between team members in different parts of the world.

## Features

- Search and add cities by IANA time zone identifiers
- Visual display of working hours across different time zones
- Real-time updates of current time in each zone
- Customizable working hours
- Share functionality to save and share your timezone configuration
- Fully client-side operation (no server required)
- Uses `Intl.DateTimeFormat` for accurate time zone calculations

## Usage

1. Search for and add cities/time zones using the search box
2. Set working hours for the team (default is 9:00-17:00)
3. Green areas indicate times when all selected locations are within working hours
4. Use the share button to get a link to your current configuration

## Technology

- Pure HTML/CSS/JavaScript
- No external dependencies
- Modern browser APIs for time zone handling

## Local Development

Simply open `time_zone_meeting_planner_index.html` in a web browser. No build process or server required.
