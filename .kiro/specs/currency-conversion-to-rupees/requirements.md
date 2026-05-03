# Requirements Document

## Introduction

This document specifies the requirements for converting all currency values from US Dollars (USD) to Indian Rupees (INR) in the booking application. The application currently stores and displays all prices in USD. This feature will convert the currency representation to INR across the entire system, including database storage, API responses, and user interface displays.

## Glossary

- **Booking_System**: The complete booking application including frontend (React/TypeScript/Vite) and backend (Node.js/TypeScript/Express)
- **Currency_Converter**: The component responsible for converting USD values to INR values
- **Service_Price**: The price field stored in the Service model in the database
- **Price_Display**: Any user interface element that shows currency values to users
- **Exchange_Rate**: The conversion rate from USD to INR (1 USD = 83 INR)
- **Database_Schema**: The Prisma schema defining the Service model structure
- **Frontend_Component**: React components that display service and booking information
- **API_Response**: JSON responses from backend endpoints containing price information

## Requirements

### Requirement 1: Database Price Storage

**User Story:** As a system administrator, I want service prices stored in INR in the database, so that the system natively operates in the target currency.

#### Acceptance Criteria

1. THE Database_Schema SHALL store Service_Price values as Float type in INR
2. WHEN existing USD prices are migrated, THE Currency_Converter SHALL multiply each Service_Price by the Exchange_Rate
3. THE Currency_Converter SHALL round converted Service_Price values to two decimal places
4. WHEN a new service is created, THE Booking_System SHALL accept Service_Price input in INR

### Requirement 2: API Response Currency Format

**User Story:** As a frontend developer, I want API responses to return prices in INR, so that the frontend receives data in the correct currency.

#### Acceptance Criteria

1. WHEN the API returns service data, THE Booking_System SHALL include Service_Price values in INR
2. WHEN the API returns booking data, THE Booking_System SHALL include Service_Price values in INR
3. THE API_Response SHALL maintain numeric precision of two decimal places for all Service_Price values

### Requirement 3: Frontend Price Display

**User Story:** As a user, I want to see all prices displayed in Indian Rupees with the rupee symbol, so that I understand the cost in my local currency.

#### Acceptance Criteria

1. WHEN displaying a Service_Price, THE Price_Display SHALL show the rupee symbol (₹) before the numeric value
2. THE Price_Display SHALL format Service_Price values with two decimal places
3. WHEN rendering the Services page, THE Frontend_Component SHALL display all Service_Price values with the rupee symbol
4. WHEN rendering the Booking page, THE Frontend_Component SHALL display the Service_Price with the rupee symbol
5. WHEN rendering the My Bookings page, THE Frontend_Component SHALL display all Service_Price values with the rupee symbol

### Requirement 4: Data Migration

**User Story:** As a system administrator, I want existing USD prices automatically converted to INR, so that historical data reflects the new currency standard.

#### Acceptance Criteria

1. THE Currency_Converter SHALL convert all existing Service_Price values from USD to INR using the Exchange_Rate
2. WHEN migration is executed, THE Currency_Converter SHALL update all Service records in the database
3. THE Currency_Converter SHALL preserve the original price precision during conversion
4. WHEN migration completes, THE Booking_System SHALL verify all Service_Price values are in INR

### Requirement 5: Currency Symbol Consistency

**User Story:** As a user, I want consistent currency representation throughout the application, so that I have a clear and uniform experience.

#### Acceptance Criteria

1. THE Booking_System SHALL use the rupee symbol (₹) for all Price_Display instances
2. THE Booking_System SHALL NOT display the dollar symbol ($) in any Price_Display
3. WHEN a user navigates between different pages, THE Frontend_Component SHALL maintain consistent currency formatting
4. THE Price_Display SHALL use the format "₹X.XX" where X represents the numeric value

### Requirement 6: Numeric Precision

**User Story:** As a developer, I want price values to maintain consistent precision, so that calculations and displays are accurate.

#### Acceptance Criteria

1. THE Booking_System SHALL store Service_Price values with at least two decimal places of precision
2. WHEN performing currency conversion, THE Currency_Converter SHALL round results to two decimal places
3. THE Price_Display SHALL always show exactly two decimal places for all Service_Price values
4. WHEN comparing Service_Price values, THE Booking_System SHALL use numeric comparison with two decimal place precision
